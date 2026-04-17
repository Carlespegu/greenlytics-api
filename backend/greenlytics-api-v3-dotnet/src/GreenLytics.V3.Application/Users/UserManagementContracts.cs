using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Users;

public static class UserProvisioningModes
{
    public const string Password = "password";
    public const string Invite = "invite";
}

public sealed record UserProvisioningOptions(
    string Mode,
    string? Password
);

public sealed record CreateUserCommand(
    string Email,
    string? Code,
    string Name,
    Guid? ClientId,
    Guid RoleId,
    bool IsActive,
    UserProvisioningOptions Provisioning
);

public sealed record UpdateUserCommand(
    Guid ClientId,
    Guid UserId,
    string? Email,
    string? Code,
    string? Name,
    Guid? RoleId,
    bool? IsActive
);

public sealed record UsersSearchRequest(
    UserSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record UserSearchFilters(
    string? Email,
    string? Code,
    string? Name,
    Guid? RoleId,
    bool? IsActive,
    Guid? ClientId,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);
