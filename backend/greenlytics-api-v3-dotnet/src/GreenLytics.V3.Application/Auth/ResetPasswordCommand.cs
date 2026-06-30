namespace GreenLytics.V3.Application.Auth;

public sealed record ResetPasswordCommand(string AccessToken, string NewPassword);
