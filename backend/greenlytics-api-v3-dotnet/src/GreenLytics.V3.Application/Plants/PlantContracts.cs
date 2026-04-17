using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Plants;

public sealed record PlantsSearchRequest(
    PlantSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record PlantSearchFilters(
    string? Code,
    string? Name,
    string? Description,
    Guid? ClientId,
    Guid? InstallationId,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);

public sealed record CreatePlantCommand(
    Guid ClientId,
    Guid InstallationId,
    string Code,
    string Name,
    string? Description,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    bool? IsActive
);

public sealed record UpdatePlantCommand(
    Guid ClientId,
    Guid PlantId,
    Guid? InstallationId,
    string? Code,
    string? Name,
    string? Description,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    bool? IsActive
);

public sealed record DeletePlantCommand(
    Guid ClientId,
    Guid PlantId
);

public sealed record CreatePlantPhotoCommand(
    Guid ClientId,
    Guid PlantId,
    Guid? PhotoTypeId,
    string FileName,
    string FileUrl,
    bool IsPrimary,
    bool? IsActive
);

public sealed record SetPlantPhotoPrimaryCommand(
    Guid ClientId,
    Guid PlantId,
    Guid PhotoId
);

public sealed record DeletePlantPhotoCommand(
    Guid ClientId,
    Guid PlantId,
    Guid PhotoId
);

public sealed record CreatePlantThresholdCommand(
    Guid ClientId,
    Guid PlantId,
    Guid ReadingTypeId,
    Guid? UnitTypeId,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? OptimalValue,
    bool? IsActive
);

public sealed record UpdatePlantThresholdCommand(
    Guid ClientId,
    Guid PlantId,
    Guid ThresholdId,
    Guid? ReadingTypeId,
    Guid? UnitTypeId,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? OptimalValue,
    bool? IsActive
);

public sealed record DeletePlantThresholdCommand(
    Guid ClientId,
    Guid PlantId,
    Guid ThresholdId
);

public sealed record CreatePlantEventCommand(
    Guid ClientId,
    Guid PlantId,
    Guid EventTypeId,
    string Title,
    string? Description,
    string? Notes,
    DateTime EventDate,
    bool? IsActive
);

public sealed record UpdatePlantEventCommand(
    Guid ClientId,
    Guid PlantId,
    Guid EventId,
    Guid? EventTypeId,
    string? Title,
    string? Description,
    string? Notes,
    DateTime? EventDate,
    bool? IsActive
);

public sealed record DeletePlantEventCommand(
    Guid ClientId,
    Guid PlantId,
    Guid EventId
);
