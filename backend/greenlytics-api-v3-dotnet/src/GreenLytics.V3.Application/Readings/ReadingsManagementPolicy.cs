using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Readings;

public static class ReadingsManagementPolicy
{
    public static bool CanViewReadings(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);

    public static void RequireCanViewReadings(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanViewReadings(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view readings.");
        }
    }
}
