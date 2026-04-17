using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Devices;

public static class DeviceManagementPolicy
{
    public static bool CanManageDevices(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static bool CanViewDevices(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);

    public static void RequireCanViewDevices(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanViewDevices(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view devices.");
        }
    }

    public static void RequireCanManageDevices(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanManageDevices(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage devices.");
        }
    }
}
