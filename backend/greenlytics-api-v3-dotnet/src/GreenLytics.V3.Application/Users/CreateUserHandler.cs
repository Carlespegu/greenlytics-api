using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.Extensions.Logging;

namespace GreenLytics.V3.Application.Users;

public sealed class CreateUserHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly IClock _clock;
    private readonly UserManagementValidationService _validationService;
    private readonly ILogger<CreateUserHandler> _logger;

    public CreateUserHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        ISupabaseAuthGateway supabaseAuthGateway,
        IClock clock,
        UserManagementValidationService validationService,
        ILogger<CreateUserHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _supabaseAuthGateway = supabaseAuthGateway;
        _clock = clock;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task<UserDto> HandleAsync(CreateUserCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);
        var actorUserId = _currentUser.UserId;

        SupabaseProvisionedUser? provisionedUser = null;
        try
        {
            var shouldConfirmEmailImmediately = validated.Provisioning.Mode == UserProvisioningModes.Password
                && IsTestEnvironment();

            provisionedUser = validated.Provisioning.Mode == UserProvisioningModes.Password
                ? await _supabaseAuthGateway.CreateUserWithPasswordAsync(
                    new SupabaseAdminCreateUserRequest(
                        validated.Email,
                        validated.Provisioning.Password,
                        validated.Name,
                        validated.Code,
                        shouldConfirmEmailImmediately),
                    cancellationToken)
                : await _supabaseAuthGateway.InviteUserByEmailAsync(validated.Email, cancellationToken);

            var user = new Domain.Entities.User
            {
                Id = Guid.NewGuid(),
                ExternalAuthId = provisionedUser.Id.ToString(),
                Email = validated.Email,
                Code = validated.Code,
                Name = validated.Name,
                ClientId = validated.ClientId,
                RoleId = validated.Role.Id,
                IsActive = validated.IsActive,
                PasswordHash = null,
                CreatedAt = _clock.UtcNow,
                CreatedByUserId = actorUserId,
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return ToDto(user, validated.Role);
        }
        catch (Exception exception) when (exception is not RequestValidationException and not ForbiddenOperationException)
        {
            if (provisionedUser is not null)
            {
                try
                {
                    await _supabaseAuthGateway.DeleteUserAsync(provisionedUser.Id, cancellationToken);
                }
                catch (Exception rollbackException)
                {
                    _logger.LogCritical(
                        rollbackException,
                        "users.create.rollback_failed supabase_user_id={SupabaseUserId} email={Email}",
                        provisionedUser.Id,
                        validated.Email);
                    throw new UserProvisioningException("User provisioning failed after creating the identity provider account. Manual cleanup may be required.", exception);
                }
            }

            _logger.LogError(exception, "users.create.failed email={Email}", validated.Email);
            throw new UserProvisioningException("User provisioning failed.", exception);
        }
    }

    private static bool IsTestEnvironment()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        return string.Equals(environment, "Test", StringComparison.OrdinalIgnoreCase);
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
