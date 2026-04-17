using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Users;

public static class UserMapper
{
    public static UserDto ToDto(this User user)
    {
        ArgumentNullException.ThrowIfNull(user.Role);

        return new UserDto(
            user.Id,
            user.ExternalAuthId,
            user.Email,
            user.Code,
            user.Name,
            user.ClientId,
            user.RoleId,
            user.Role.Code,
            user.Role.Name,
            user.IsActive,
            user.CreatedAt,
            user.CreatedByUserId,
            user.UpdatedAt,
            user.UpdatedByUserId);
    }
}
