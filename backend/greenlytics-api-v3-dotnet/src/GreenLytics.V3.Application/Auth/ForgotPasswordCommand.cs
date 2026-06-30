namespace GreenLytics.V3.Application.Auth;

public sealed record ForgotPasswordCommand(string Email, string? RedirectUrl);
