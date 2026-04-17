namespace GreenLytics.V3.Application.Users;

public sealed record UserDto(
    Guid Id,
    string? ExternalAuthId,
    string Email,
    string? Code,
    string Name,
    Guid ClientId,
    Guid RoleId,
    string RoleCode,
    string RoleName,
    bool IsActive,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
