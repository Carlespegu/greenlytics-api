using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Users;

public static class UserManagementPolicy
{
    public static bool CanManageUsers(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static bool CanViewUsers(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin, RoleCodes.Manager);

    public static void RequireCanViewUsers(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanViewUsers(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to view users.");
        }
    }

    public static void RequireCanManageUsers(ICurrentUser currentUser)
    {
        _ = CurrentUserAuthorization.RequireClientScope(currentUser);
        if (!CanManageUsers(currentUser))
        {
            throw new ForbiddenOperationException("The current user does not have permission to manage users.");
        }
    }

    public static bool IsAdmin(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Admin);

    public static bool IsManager(ICurrentUser currentUser)
        => CurrentUserAuthorization.IsInAnyRole(currentUser, RoleCodes.Manager);

    public static void EnsureRoleAssignmentAllowed(ICurrentUser currentUser, Role targetRole)
    {
        if (IsAdmin(currentUser))
        {
            return;
        }

        if (IsManager(currentUser) && string.Equals(targetRole.Code, RoleCodes.Viewer, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        throw new ForbiddenOperationException("The current user cannot assign the requested role.");
    }
}
