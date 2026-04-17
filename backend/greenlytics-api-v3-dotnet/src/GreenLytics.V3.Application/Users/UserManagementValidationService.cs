using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Users;

public sealed class UserManagementValidationService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public UserManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedCreateUserRequest> ValidateCreateAsync(CreateUserCommand command, CancellationToken cancellationToken = default)
    {
        UserManagementPolicy.RequireCanManageUsers(_currentUser);
        var creatorClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var targetClientId = await ResolveTargetClientIdAsync(command.ClientId, creatorClientId, cancellationToken);
        var role = await ResolveRoleAsync(command.RoleId, cancellationToken);
        UserManagementPolicy.EnsureRoleAssignmentAllowed(_currentUser, role);

        var email = NormalizeEmail(command.Email);
        var code = NormalizeOptional(command.Code, "code", 100);
        var name = RequireName(command.Name);
        var provisioning = ValidateProvisioning(command.Provisioning);

        await EnsureNoDuplicateEmailAsync(email, null, cancellationToken);

        return new ValidatedCreateUserRequest(
            email,
            code,
            name,
            targetClientId,
            role,
            command.IsActive,
            provisioning);
    }

    public async Task<ValidatedUpdateUserRequest> ValidateUpdateAsync(UpdateUserCommand command, CancellationToken cancellationToken = default)
    {
        UserManagementPolicy.RequireCanManageUsers(_currentUser);
        var creatorClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        EnsureClientScopeAllowed(command.ClientId, creatorClientId);
        var targetUser = await ResolveScopedUserAsync(command.ClientId, command.UserId, cancellationToken);

        Role? role = null;
        if (command.RoleId.HasValue && command.RoleId.Value != Guid.Empty)
        {
            role = await ResolveRoleAsync(command.RoleId.Value, cancellationToken);
            UserManagementPolicy.EnsureRoleAssignmentAllowed(_currentUser, role);
        }

        if (UserManagementPolicy.IsManager(_currentUser) && targetUser.ClientId != creatorClientId)
        {
            throw new ForbiddenOperationException("Managers can only manage users from their own client.");
        }

        if (UserManagementPolicy.IsManager(_currentUser) &&
            !string.Equals(targetUser.Role?.Code, RoleCodes.Viewer, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenOperationException("Managers can currently manage only viewer users.");
        }

        var email = NormalizeEmailForUpdate(command.Email);
        var code = NormalizeCodeForUpdate(command.Code);
        var name = NormalizeNameForUpdate(command.Name);

        if (email is not null)
        {
            await EnsureNoDuplicateEmailAsync(email, targetUser.Id, cancellationToken);
        }

        return new ValidatedUpdateUserRequest(
            targetUser,
            email,
            code,
            name,
            role,
            command.IsActive);
    }

    public async Task<ValidatedUserScope> ValidateReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        UserManagementPolicy.RequireCanViewUsers(_currentUser);
        var user = await ResolveScopedUserAsync(userId, cancellationToken);
        return new ValidatedUserScope(user);
    }

    public async Task<ValidatedUserScope> ValidateStatusChangeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        UserManagementPolicy.RequireCanManageUsers(_currentUser);
        var user = await ResolveScopedUserAsync(userId, cancellationToken);

        if (UserManagementPolicy.IsManager(_currentUser) &&
            !string.Equals(user.Role?.Code, RoleCodes.Viewer, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenOperationException("Managers can currently activate or deactivate only viewer users.");
        }

        return new ValidatedUserScope(user);
    }

    public async Task<ValidatedUsersSearchRequest> ValidateSearchAsync(UsersSearchRequest request, CancellationToken cancellationToken = default)
    {
        UserManagementPolicy.RequireCanViewUsers(_currentUser);
        var creatorClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var filters = request.Filters ?? new UserSearchFilters(null, null, null, null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        Guid? effectiveClientId = null;
        if (UserManagementPolicy.IsAdmin(_currentUser))
        {
            if (filters.ClientId.HasValue)
            {
                effectiveClientId = await EnsureClientExistsAsync(filters.ClientId.Value, cancellationToken);
            }
        }
        else
        {
            if (filters.ClientId.HasValue && filters.ClientId.Value != creatorClientId)
            {
                throw new ForbiddenOperationException("Managers can only search users in their own client scope.");
            }

            effectiveClientId = creatorClientId;
        }

        return new ValidatedUsersSearchRequest(
            NormalizeSearchText(filters.Email, "filters.email", 150),
            NormalizeOptional(filters.Code, "filters.code", 100),
            NormalizeOptional(filters.Name, "filters.name", 200),
            await ResolveSearchRoleIdAsync(filters.RoleId, cancellationToken),
            filters.IsActive,
            effectiveClientId,
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(request.Sort, "createdAt", "email", "code", "name", "createdAt"));
    }

    private async Task<User> ResolveScopedUserAsync(Guid clientId, Guid userId, CancellationToken cancellationToken)
    {
        var creatorClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var query = _dbContext.Users
            .Include(x => x.Role)
            .Where(x => x.Id == userId && x.ClientId == clientId && !x.IsDeleted);

        if (!UserManagementPolicy.IsAdmin(_currentUser))
        {
            query = query.Where(x => x.ClientId == creatorClientId);
        }

        var user = await query.SingleOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            throw new EntityNotFoundException("User not found for this client.");
        }

        return user;
    }

    private async Task<User> ResolveScopedUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var creatorClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var query = _dbContext.Users
            .Include(x => x.Role)
            .Where(x => x.Id == userId && !x.IsDeleted);

        if (!UserManagementPolicy.IsAdmin(_currentUser))
        {
            query = query.Where(x => x.ClientId == creatorClientId);
        }

        var user = await query.SingleOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            throw new EntityNotFoundException("The requested user was not found for the current client scope.");
        }

        return user;
    }

    private async Task<Role> ResolveRoleAsync(Guid roleId, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == roleId && x.IsActive && !x.IsDeleted, cancellationToken);

        if (role is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested role does not exist.",
                RequestValidationException.Field("roleId", "not_found", "The requested role does not exist."));
        }

        return role;
    }

    private async Task<Guid?> ResolveSearchRoleIdAsync(Guid? roleId, CancellationToken cancellationToken)
    {
        if (!roleId.HasValue || roleId.Value == Guid.Empty)
        {
            return null;
        }

        _ = await ResolveRoleAsync(roleId.Value, cancellationToken);
        return roleId.Value;
    }

    private async Task<Guid> ResolveTargetClientIdAsync(Guid? requestedClientId, Guid creatorClientId, CancellationToken cancellationToken)
    {
        if (UserManagementPolicy.IsManager(_currentUser))
        {
            if (requestedClientId.HasValue && requestedClientId.Value != creatorClientId)
            {
                throw new ForbiddenOperationException("Managers cannot assign users outside their own client scope.");
            }

            return creatorClientId;
        }

        if (!requestedClientId.HasValue || requestedClientId.Value == Guid.Empty)
        {
            throw RequestValidationException.BadRequest(
                "Client id is required.",
                RequestValidationException.Field("clientId", "required", "Client id is required."));
        }

        return await EnsureClientExistsAsync(requestedClientId.Value, cancellationToken);
    }

    private void EnsureClientScopeAllowed(Guid clientId, Guid creatorClientId)
    {
        if (UserManagementPolicy.IsManager(_currentUser) && clientId != creatorClientId)
        {
            throw new ForbiddenOperationException("Managers cannot manage users outside their own client scope.");
        }
    }

    private async Task<Guid> EnsureClientExistsAsync(Guid clientId, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Clients
            .AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);

        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field("clientId", "not_found", "The requested client does not exist."));
        }

        return clientId;
    }

    private async Task EnsureNoDuplicateEmailAsync(string email, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Users
            .AnyAsync(
                x => !x.IsDeleted
                     && x.Email == email
                     && (!currentUserId.HasValue || x.Id != currentUserId.Value),
                cancellationToken);

        if (exists)
        {
            throw RequestValidationException.Conflict(
                $"A local user with email '{email}' already exists.",
                RequestValidationException.Field("email", "duplicate", $"A local user with email '{email}' already exists."));
        }
    }

    private static ValidatedProvisioningOptions ValidateProvisioning(UserProvisioningOptions provisioning)
    {
        var mode = (provisioning.Mode ?? string.Empty).Trim().ToLowerInvariant();
        return mode switch
        {
            UserProvisioningModes.Password when string.IsNullOrWhiteSpace(provisioning.Password)
                => throw RequestValidationException.BadRequest(
                    "Password is required when provisioning mode is password.",
                    RequestValidationException.Field("provisioning.password", "required", "Password is required when provisioning mode is password.")),
            UserProvisioningModes.Password when provisioning.Password!.Trim().Length < 8
                => throw RequestValidationException.BadRequest(
                    "Password must be at least 8 characters long.",
                    RequestValidationException.Field("provisioning.password", "too_short", "Password must be at least 8 characters long.")),
            UserProvisioningModes.Password => new ValidatedProvisioningOptions(UserProvisioningModes.Password, provisioning.Password!.Trim()),
            UserProvisioningModes.Invite when !string.IsNullOrWhiteSpace(provisioning.Password)
                => throw RequestValidationException.BadRequest(
                    "Password must not be provided when provisioning mode is invite.",
                    RequestValidationException.Field("provisioning.password", "not_allowed", "Password must not be provided when provisioning mode is invite.")),
            UserProvisioningModes.Invite => new ValidatedProvisioningOptions(UserProvisioningModes.Invite, null),
            _ => throw RequestValidationException.BadRequest(
                "Provisioning mode must be 'password' or 'invite'.",
                RequestValidationException.Field("provisioning.mode", "unsupported", "Provisioning mode must be 'password' or 'invite'.")),
        };
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = NormalizeEmailOptional(email);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Email is required.",
                RequestValidationException.Field("email", "required", "Email is required."));
        }

        return normalized;
    }

    private static string? NormalizeEmailOptional(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var normalized = email.Trim().ToLowerInvariant();
        try
        {
            _ = new System.Net.Mail.MailAddress(normalized);
        }
        catch
        {
            throw RequestValidationException.BadRequest(
                "Email format is invalid.",
                RequestValidationException.Field("email", "invalid_format", "Email format is invalid."));
        }

        return normalized;
    }

    private static string? NormalizeSearchText(string? value, string field, int maxLength)
        => NormalizeOptional(value, field, maxLength);

    private static string? NormalizeEmailForUpdate(string? email)
    {
        if (email is null)
        {
            return null;
        }

        var normalized = NormalizeEmailOptional(email);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Email cannot be empty when provided.",
                RequestValidationException.Field("email", "required", "Email cannot be empty when provided."));
        }

        return normalized;
    }

    private static string? NormalizeCodeForUpdate(string? code)
    {
        if (code is null)
        {
            return null;
        }

        var normalized = code.Trim();
        if (normalized.Length == 0)
        {
            throw RequestValidationException.BadRequest(
                "Code cannot be empty when provided.",
                RequestValidationException.Field("code", "required", "Code cannot be empty when provided."));
        }

        return NormalizeOptional(normalized, "code", 100);
    }

    private static string? NormalizeNameForUpdate(string? name)
    {
        if (name is null)
        {
            return null;
        }

        var normalized = NormalizeOptional(name, "name", 200);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Name cannot be empty when provided.",
                RequestValidationException.Field("name", "required", "Name cannot be empty when provided."));
        }

        return normalized;
    }

    private static string RequireName(string value)
    {
        var normalized = NormalizeOptional(value, "name", 200);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Name is required.",
                RequestValidationException.Field("name", "required", "Name is required."));
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value, string field, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw RequestValidationException.BadRequest(
                $"{field} exceeds the maximum allowed length of {maxLength} characters.",
                RequestValidationException.Field(field, "max_length", $"{field} exceeds the maximum allowed length of {maxLength} characters."));
        }

        return normalized;
    }
}

public sealed record ValidatedProvisioningOptions(
    string Mode,
    string? Password
);

public sealed record ValidatedCreateUserRequest(
    string Email,
    string? Code,
    string Name,
    Guid ClientId,
    Role Role,
    bool IsActive,
    ValidatedProvisioningOptions Provisioning
);

public sealed record ValidatedUpdateUserRequest(
    User User,
    string? Email,
    string? Code,
    string? Name,
    Role? Role,
    bool? IsActive
);

public sealed record ValidatedUserScope(
    User User
);

public sealed record ValidatedUsersSearchRequest(
    string? Email,
    string? Code,
    string? Name,
    Guid? RoleId,
    bool? IsActive,
    Guid? ClientId,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);
