using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Auth;

public sealed class ResetPasswordHandler
{
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;

    public ResetPasswordHandler(ISupabaseAuthGateway supabaseAuthGateway)
    {
        _supabaseAuthGateway = supabaseAuthGateway;
    }

    public async Task HandleAsync(ResetPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var accessToken = command.AccessToken?.Trim();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw RequestValidationException.BadRequest(
                "Recovery token is required.",
                RequestValidationException.Field("accessToken", "required", "Recovery token is required."));
        }

        var password = command.NewPassword?.Trim() ?? string.Empty;
        if (password.Length < 8)
        {
            throw RequestValidationException.BadRequest(
                "The new password must have at least 8 characters.",
                RequestValidationException.Field("newPassword", "min_length", "The new password must have at least 8 characters."));
        }

        await _supabaseAuthGateway.UpdatePasswordAsync(accessToken, password, cancellationToken);
    }
}
