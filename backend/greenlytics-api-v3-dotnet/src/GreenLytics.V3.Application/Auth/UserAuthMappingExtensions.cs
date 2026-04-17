using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Auth;

public static class UserAuthMappingExtensions
{
    public static CurrentUserDto ToCurrentUserDto(this User user)
    {
        ArgumentNullException.ThrowIfNull(user.Role);

        return new CurrentUserDto(
            user.Id,
            user.Username,
            user.Email,
            user.RoleId,
            user.Role.Code,
            user.Role.Name,
            user.ClientId,
            user.IsActive,
            true);
    }
}
