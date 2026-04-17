namespace GreenLytics.V3.Application.Common;

public sealed record PagingRequest(int Page = 1, int PageSize = 20);

public sealed record SortRequest(string? Field = null, string? Direction = null);

public sealed record SearchResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);
