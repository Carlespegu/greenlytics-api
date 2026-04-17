namespace GreenLytics.V3.Shared.Contracts;

public sealed record SearchPagination(
    int Page = 1,
    int PageSize = 20
);

public sealed record SearchSort(
    string? Field = null,
    string? Direction = null
);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);
