using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Auth;

public static class CurrentUserAuthorization
{
    public static Guid RequireClientScope(ICurrentUser currentUser)
    {
        if (!currentUser.IsAuthenticated)
        {
            throw new UnauthorizedAccessException("The current user is not authenticated.");
        }

        if (!currentUser.ClientId.HasValue || currentUser.ClientId.Value == Guid.Empty)
        {
            throw new ForbiddenOperationException("The current user does not have a valid client scope.");
        }

        return currentUser.ClientId.Value;
    }

    public static bool IsInAnyRole(ICurrentUser currentUser, params string[] roleCodes)
    {
        if (string.IsNullOrWhiteSpace(currentUser.RoleCode))
        {
            return false;
        }

        return roleCodes.Any(roleCode => string.Equals(
            currentUser.RoleCode,
            roleCode,
            StringComparison.OrdinalIgnoreCase));
    }

    public static bool CanManagePlants(ICurrentUser currentUser)
        => IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static bool CanViewPlants(ICurrentUser currentUser)
        => IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager, RoleCodes.Viewer);

    public static void RequireCanManagePlants(ICurrentUser currentUser)
    {
        _ = RequireClientScope(currentUser);
        if (!CanManagePlants(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage plant photos.");
        }
    }

    public static void RequireCanViewPlants(ICurrentUser currentUser)
    {
        _ = RequireClientScope(currentUser);
        if (!CanViewPlants(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view plants.");
        }
    }
}
