namespace GreenLytics.V3.Application.Auth;

public sealed record SupabaseAuthTokens(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    Guid SupabaseUserId,
    string? Email
);
