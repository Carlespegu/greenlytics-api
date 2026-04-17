using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.Extensions.Logging;

namespace GreenLytics.V3.Application.Users;

public sealed class UpdateUserHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly IClock _clock;
    private readonly UserManagementValidationService _validationService;
    private readonly ILogger<UpdateUserHandler> _logger;

    public UpdateUserHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        ISupabaseAuthGateway supabaseAuthGateway,
        IClock clock,
        UserManagementValidationService validationService,
        ILogger<UpdateUserHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _supabaseAuthGateway = supabaseAuthGateway;
        _clock = clock;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task<UserDto> HandleAsync(UpdateUserCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);
        var actorUserId = _currentUser.UserId;

        try
        {
            var nextEmail = validated.Email ?? validated.User.Email;
            var nextCode = validated.Code ?? validated.User.Code;
            var nextName = validated.Name ?? validated.User.Name;

            if (validated.User.SupabaseAuthUserId.HasValue && (validated.Email is not null || validated.Code is not null || validated.Name is not null))
            {
                await _supabaseAuthGateway.UpdateUserAsync(
                    validated.User.SupabaseAuthUserId.Value,
                    new SupabaseAdminUpdateUserRequest(
                        nextEmail,
                        null,
                        nextName,
                        nextCode,
                        null),
                    cancellationToken);
            }

            if (validated.Email is not null)
            {
                validated.User.Email = validated.Email;
            }

            if (validated.Code is not null)
            {
                validated.User.Code = validated.Code;
            }

            if (validated.Name is not null)
            {
                validated.User.Name = validated.Name;
            }

            if (validated.Role is not null)
            {
                validated.User.RoleId = validated.Role.Id;
            }

            if (validated.IsActive.HasValue)
            {
                validated.User.IsActive = validated.IsActive.Value;
            }

            validated.User.UpdatedAt = _clock.UtcNow;
            validated.User.UpdatedByUserId = actorUserId;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return ToDto(validated.User, validated.Role ?? validated.User.Role ?? throw new InvalidOperationException("Role information is required to build the response."));
        }
        catch (Exception exception) when (exception is not RequestValidationException and not ForbiddenOperationException and not EntityNotFoundException)
        {
            _logger.LogError(exception, "users.update.failed user_id={UserId}", command.UserId);
            throw new UserProvisioningException("User update failed.", exception);
        }
    }

    private static UserDto ToDto(Domain.Entities.User user, Domain.Entities.Role role)
        => new(
            user.Id,
            user.ExternalAuthId,
            user.Email,
            user.Code,
            user.Name,
            user.ClientId,
            user.RoleId,
            role.Code,
            role.Name,
            user.IsActive,
            user.CreatedAt,
            user.CreatedByUserId,
            user.UpdatedAt,
            user.UpdatedByUserId);
}
