using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.Common;

public static class SearchRequestValidation
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public static SearchPagination NormalizePagination(SearchPagination? pagination)
    {
        var page = pagination?.Page ?? DefaultPage;
        var pageSize = pagination?.PageSize ?? DefaultPageSize;

        if (page < 1)
        {
            throw RequestValidationException.BadRequest(
                "Page must be greater than or equal to 1.",
                RequestValidationException.Field("pagination.page", "invalid_range", "Page must be greater than or equal to 1."));
        }

        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            throw RequestValidationException.BadRequest(
                $"Page size must be between 1 and {MaxPageSize}.",
                RequestValidationException.Field("pagination.pageSize", "invalid_range", $"Page size must be between 1 and {MaxPageSize}."));
        }

        return new SearchPagination(page, pageSize);
    }

    public static NormalizedSort NormalizeSort(
        SearchSort? sort,
        string defaultField,
        params string[] allowedFields)
    {
        var field = (sort?.Field ?? defaultField).Trim();
        if (string.IsNullOrWhiteSpace(field))
        {
            field = defaultField;
        }

        var matchedField = allowedFields.FirstOrDefault(candidate => string.Equals(candidate, field, StringComparison.OrdinalIgnoreCase));
        if (matchedField is null)
        {
            throw RequestValidationException.BadRequest(
                $"Sorting by '{field}' is not supported.",
                RequestValidationException.Field("sort.field", "unsupported", $"Sorting by '{field}' is not supported."));
        }

        var direction = (sort?.Direction ?? "desc").Trim();
        if (string.IsNullOrWhiteSpace(direction))
        {
            direction = "desc";
        }

        var normalizedDirection = direction.ToLowerInvariant() switch
        {
            "asc" => "asc",
            "desc" => "desc",
            _ => throw RequestValidationException.BadRequest(
                "Sort direction must be 'asc' or 'desc'.",
                RequestValidationException.Field("sort.direction", "unsupported", "Sort direction must be 'asc' or 'desc'.")),
        };

        return new NormalizedSort(matchedField, normalizedDirection == "desc");
    }

    public static void EnsureDateRange(DateTime? fromDate, DateTime? toDate, string fromField, string toField)
    {
        if (fromDate.HasValue && toDate.HasValue && fromDate.Value > toDate.Value)
        {
            throw RequestValidationException.BadRequest(
                $"{fromField} must be earlier than or equal to {toField}.",
                RequestValidationException.Field(fromField, "invalid_range", $"{fromField} must be earlier than or equal to {toField}."),
                RequestValidationException.Field(toField, "invalid_range", $"{fromField} must be earlier than or equal to {toField}."));
        }
    }

    public static PagedResult<T> ToPagedResult<T>(IReadOnlyList<T> items, SearchPagination pagination, int totalItems)
    {
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pagination.PageSize);

        return new PagedResult<T>(items, pagination.Page, pagination.PageSize, totalItems, totalPages);
    }
}

public sealed record NormalizedSort(
    string Field,
    bool Descending
);
