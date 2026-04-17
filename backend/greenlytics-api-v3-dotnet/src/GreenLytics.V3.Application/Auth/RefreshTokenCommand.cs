namespace GreenLytics.V3.Application.Auth;

public sealed record RefreshTokenCommand(string RefreshToken, string? IpAddress, string? UserAgent);
