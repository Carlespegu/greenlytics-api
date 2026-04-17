namespace GreenLytics.V3.Application.Auth;

public sealed record LoginResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    CurrentUserDto User
);
