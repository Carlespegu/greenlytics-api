using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Clients;

public sealed record CreateClientCommand(
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record UpdateClientCommand(
    Guid ClientId,
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record ClientsSearchRequest(
    ClientSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record ClientSearchFilters(
    string? Code,
    string? Name,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);
