using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Readings;

public sealed record ReadingsSearchRequest(
    ReadingSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record ReadingSearchFilters(
    Guid? DeviceId,
    Guid? PlantId,
    Guid? ReadingTypeId,
    DateTime? DateFrom,
    DateTime? DateTo,
    decimal? ValueMin,
    decimal? ValueMax,
    Guid? ClientId,
    Guid? InstallationId
);

public sealed record ReadingsTimeseriesRequest(
    ReadingsTimeseriesFilters? Filters,
    string? GroupBy,
    IReadOnlyList<string>? Metrics
);

public sealed record ReadingsTimeseriesFilters(
    Guid? DeviceId,
    Guid? PlantId,
    Guid? ReadingTypeId,
    DateTime? DateFrom,
    DateTime? DateTo,
    Guid? ClientId,
    Guid? InstallationId
);
