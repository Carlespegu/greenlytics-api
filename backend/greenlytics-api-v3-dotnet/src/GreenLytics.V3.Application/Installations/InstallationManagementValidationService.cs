using System.Text.RegularExpressions;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Installations;

public sealed class InstallationManagementValidationService
{
    private static readonly Regex InstallationCodeRegex = new("^[A-Z0-9][A-Z0-9_-]{0,49}$", RegexOptions.Compiled);

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public InstallationManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedInstallationScope> ValidateReadAsync(Guid clientId, Guid installationId, CancellationToken cancellationToken = default)
    {
        InstallationManagementPolicy.RequireCanViewInstallations(_currentUser);
        await EnsureClientAccessAsync(clientId, "clientId", cancellationToken);

        var installation = await LoadInstallationAsync(clientId, installationId, cancellationToken);
        if (installation is null)
        {
            throw new EntityNotFoundException("Installation not found for this client.");
        }

        return new ValidatedInstallationScope(installation);
    }

    public async Task<ValidatedCreateInstallationRequest> ValidateCreateAsync(CreateInstallationCommand command, CancellationToken cancellationToken = default)
    {
        InstallationManagementPolicy.RequireCanManageInstallations(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var code = NormalizeRequiredCode(command.Code);
        var name = RequireText(command.Name, "name", "Installation name", 150);
        var description = NormalizeOptional(command.Description, "description", 1000);
        var location = NormalizeOptional(command.Location, "location", 250);

        var duplicateExists = await _dbContext.Installations
            .AnyAsync(x => !x.IsDeleted && x.ClientId == command.ClientId && x.Code == code, cancellationToken);
        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                $"Installation with code '{code}' already exists for this client.",
                RequestValidationException.Field("code", "duplicate", $"Installation with code '{code}' already exists for this client."));
        }

        return new ValidatedCreateInstallationRequest(
            command.ClientId,
            code,
            name,
            description,
            location,
            command.IsActive ?? true);
    }

    public async Task<ValidatedUpdateInstallationRequest> ValidateUpdateAsync(UpdateInstallationCommand command, CancellationToken cancellationToken = default)
    {
        InstallationManagementPolicy.RequireCanManageInstallations(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var installation = await LoadInstallationAsync(command.ClientId, command.InstallationId, cancellationToken);
        if (installation is null)
        {
            throw new EntityNotFoundException("Installation not found for this client.");
        }

        var code = command.Code is null ? null : NormalizeRequiredCode(command.Code);
        var name = command.Name is null ? null : RequireText(command.Name, "name", "Installation name", 150);
        var description = command.Description is null ? null : NormalizeOptional(command.Description, "description", 1000);
        var location = command.Location is null ? null : NormalizeOptional(command.Location, "location", 250);

        if (!string.IsNullOrWhiteSpace(code))
        {
            var duplicateExists = await _dbContext.Installations
                .AnyAsync(
                    x => !x.IsDeleted
                         && x.ClientId == command.ClientId
                         && x.Code == code
                         && x.Id != installation.Id,
                    cancellationToken);
            if (duplicateExists)
            {
                throw RequestValidationException.Conflict(
                    $"Installation with code '{code}' already exists for this client.",
                    RequestValidationException.Field("code", "duplicate", $"Installation with code '{code}' already exists for this client."));
            }
        }

        return new ValidatedUpdateInstallationRequest(
            installation,
            code,
            name,
            description,
            location,
            command.IsActive);
    }

    public async Task<ValidatedInstallationDeleteRequest> ValidateDeleteAsync(DeleteInstallationCommand command, CancellationToken cancellationToken = default)
    {
        InstallationManagementPolicy.RequireCanManageInstallations(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var installation = await LoadInstallationAsync(command.ClientId, command.InstallationId, cancellationToken);
        if (installation is null)
        {
            throw new EntityNotFoundException("Installation not found for this client.");
        }

        return new ValidatedInstallationDeleteRequest(installation);
    }

    public async Task<ValidatedInstallationStatusChange> ValidateStatusChangeAsync(Guid clientId, Guid installationId, CancellationToken cancellationToken = default)
    {
        var validated = await ValidateReadAsync(clientId, installationId, cancellationToken);
        InstallationManagementPolicy.RequireCanManageInstallations(_currentUser);
        return new ValidatedInstallationStatusChange(validated.Installation);
    }

    public async Task<ValidatedInstallationsSearchRequest> ValidateSearchAsync(InstallationsSearchRequest request, CancellationToken cancellationToken = default)
    {
        InstallationManagementPolicy.RequireCanViewInstallations(_currentUser);
        var filters = request.Filters ?? new InstallationSearchFilters(null, null, null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        Guid? effectiveClientId;
        if (InstallationManagementPolicy.IsAdmin(_currentUser))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                await EnsureClientExistsAsync(effectiveClientId.Value, "filters.clientId", cancellationToken);
            }
        }
        else
        {
            var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        return new ValidatedInstallationsSearchRequest(
            effectiveClientId,
            NormalizeCodeOptional(filters.Code),
            NormalizeOptional(filters.Name, "filters.name", 150),
            NormalizeOptional(filters.Location, "filters.location", 250),
            filters.IsActive,
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(
                request.Sort,
                "createdAt",
                "code",
                "name",
                "location",
                "createdAt",
                "updatedAt",
                "isActive",
                "plantsCount",
                "devicesCount"));
    }

    private async Task EnsureClientAccessAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        if (InstallationManagementPolicy.IsAdmin(_currentUser))
        {
            await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
            return;
        }

        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        if (clientId != currentClientId)
        {
            throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
        }

        await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
    }

    private async Task EnsureClientExistsAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Clients
            .AsNoTracking()
            .AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested client does not exist."));
        }
    }

    private Task<Installation?> LoadInstallationAsync(Guid clientId, Guid installationId, CancellationToken cancellationToken)
        => _dbContext.Installations
            .SingleOrDefaultAsync(
                x => x.Id == installationId
                    && x.ClientId == clientId
                    && !x.IsDeleted,
                cancellationToken);

    private static string RequireText(string input, string fieldKey, string fieldLabel, int maxLength)
    {
        var normalized = NormalizeOptional(input, fieldKey, maxLength);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                $"{fieldLabel} is required.",
                RequestValidationException.Field(fieldKey, "required", $"{fieldLabel} is required."));
        }

        return normalized;
    }

    private static string NormalizeRequiredCode(string input)
    {
        var normalized = NormalizeCodeOptional(input);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Installation code is required.",
                RequestValidationException.Field("code", "required", "Installation code is required."));
        }

        return normalized;
    }

    private static string? NormalizeCodeOptional(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = Regex.Replace(input.Trim().ToUpperInvariant(), "\\s+", "-");
        if (!InstallationCodeRegex.IsMatch(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Installation code contains unsupported characters. Use only letters, numbers, hyphen and underscore.",
                RequestValidationException.Field("code", "invalid_format", "Installation code contains unsupported characters. Use only letters, numbers, hyphen and underscore."));
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? input, string fieldKey, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = input.Trim();
        if (normalized.Length > maxLength)
        {
            throw RequestValidationException.BadRequest(
                $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters.",
                RequestValidationException.Field(fieldKey, "max_length", $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters."));
        }

        return normalized;
    }
}

public sealed record ValidatedInstallationScope(
    Installation Installation
);

public sealed record ValidatedCreateInstallationRequest(
    Guid ClientId,
    string Code,
    string Name,
    string? Description,
    string? Location,
    bool IsActive
);

public sealed record ValidatedUpdateInstallationRequest(
    Installation Installation,
    string? Code,
    string? Name,
    string? Description,
    string? Location,
    bool? IsActive
);

public sealed record ValidatedInstallationDeleteRequest(
    Installation Installation
);

public sealed record ValidatedInstallationStatusChange(
    Installation Installation
);

public sealed record ValidatedInstallationsSearchRequest(
    Guid? EffectiveClientId,
    string? Code,
    string? Name,
    string? Location,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);
