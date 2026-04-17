using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.Extensions.Logging;

namespace GreenLytics.V3.Application.Users;

public sealed class ResendUserInviteHandler
{
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly UserManagementValidationService _validationService;
    private readonly ILogger<ResendUserInviteHandler> _logger;

    public ResendUserInviteHandler(
        ISupabaseAuthGateway supabaseAuthGateway,
        UserManagementValidationService validationService,
        ILogger<ResendUserInviteHandler> logger)
    {
        _supabaseAuthGateway = supabaseAuthGateway;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task<UserDto> HandleAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(userId, cancellationToken);

        try
        {
            await _supabaseAuthGateway.InviteUserByEmailAsync(validated.User.Email, cancellationToken);
            return validated.User.ToDto();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "users.resend_invite.failed user_id={UserId}", userId);
            throw new UserProvisioningException("Could not resend the user invite.", exception);
        }
    }
}
