namespace GreenLytics.V3.Application.Auth;

public sealed record CurrentUserDto(
    Guid UserId,
    string Username,
    string Email,
    Guid RoleId,
    string RoleCode,
    string RoleName,
    Guid ClientId,
    bool IsActive,
    bool IsAuthenticated
);
