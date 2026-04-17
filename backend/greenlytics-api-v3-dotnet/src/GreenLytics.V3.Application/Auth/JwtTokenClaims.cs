namespace GreenLytics.V3.Application.Auth;

public sealed record JwtTokenClaims(
    Guid? Subject,
    string? Email,
    string? JwtId,
    string? SessionId
);
