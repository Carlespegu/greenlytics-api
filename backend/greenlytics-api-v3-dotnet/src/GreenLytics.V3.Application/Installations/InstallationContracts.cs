using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Installations;

public sealed record CreateInstallationCommand(
    Guid ClientId,
    string Code,
    string Name,
    string? Description,
    string? Location,
    bool? IsActive
);

public sealed record UpdateInstallationCommand(
    Guid ClientId,
    Guid InstallationId,
    string? Code,
    string? Name,
    string? Description,
    string? Location,
    bool? IsActive
);

public sealed record DeleteInstallationCommand(
    Guid ClientId,
    Guid InstallationId
);

public sealed record InstallationsSearchRequest(
    InstallationSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record InstallationSearchFilters(
    string? Code,
    string? Name,
    string? Location,
    Guid? ClientId,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);
