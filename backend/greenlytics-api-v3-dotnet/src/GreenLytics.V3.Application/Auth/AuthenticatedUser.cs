namespace GreenLytics.V3.Application.Auth;

public sealed record AuthenticatedUser(
    Guid? UserId,
    Guid? ClientId,
    string? Username,
    string? Email,
    string? RoleCode
);
