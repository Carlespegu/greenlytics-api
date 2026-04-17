namespace GreenLytics.V3.Application.Auth;

public sealed record LoginCommand(string Email, string Password, string? IpAddress, string? UserAgent);
