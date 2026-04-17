namespace GreenLytics.V3.Application.Auth;

public sealed record SessionValidationResult(
    bool IsValid,
    Guid? SessionId,
    Guid? UserId,
    Guid? RoleId,
    string? RoleCode,
    Guid? ClientId,
    string? Email,
    string? Username
);
