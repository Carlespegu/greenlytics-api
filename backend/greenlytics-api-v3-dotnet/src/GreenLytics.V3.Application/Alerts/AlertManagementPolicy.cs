using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Alerts;

public static class AlertManagementPolicy
{
    public static bool CanManageAlerts(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static bool CanViewAlerts(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);

    public static void RequireCanViewAlerts(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanViewAlerts(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view alerts.");
        }
    }

    public static void RequireCanManageAlerts(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanManageAlerts(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage alerts.");
        }
    }
}
