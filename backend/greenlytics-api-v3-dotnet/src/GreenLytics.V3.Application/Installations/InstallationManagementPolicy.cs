using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Installations;

public static class InstallationManagementPolicy
{
    public static bool CanManageInstallations(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static bool CanViewInstallations(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static void RequireCanViewInstallations(ICurrentUser currentUser)
    {
        if (!CanViewInstallations(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view installations.");
        }

        if (!IsAdmin(currentUser))
        {
            _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        }
    }

    public static void RequireCanManageInstallations(ICurrentUser currentUser)
    {
        if (!CanManageInstallations(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage installations.");
        }

        if (!IsAdmin(currentUser))
        {
            _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        }
    }

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);
}
