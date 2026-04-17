using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Clients;

public static class ClientManagementPolicy
{
    public static bool CanManageClients(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);

    public static bool CanViewClients(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static void RequireCanViewClients(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanViewClients(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view clients.");
        }
    }

    public static void RequireCanManageClients(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanManageClients(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage clients.");
        }
    }

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);
}
