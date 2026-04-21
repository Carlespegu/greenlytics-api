namespace GreenLytics.V3.Application.Plants;

public sealed record PlantListItemDto(
    Guid Id,
    Guid ClientId,
    Guid InstallationId,
    string Code,
    string Name,
    string? Description,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    bool IsActive,
    string? InstallationName,
    string? PlantTypeName,
    string? PlantStatusName,
    string? PrimaryPhotoUrl,
    int ThresholdsCount,
    int EventsCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public sealed record PlantPhotoDto(
    Guid Id,
    Guid PlantId,
    Guid? PhotoTypeId,
    string? PhotoTypeCode,
    string? PhotoTypeName,
    string FileName,
    string FileUrl,
    bool IsPrimary,
    bool IsActive,
    DateTime CreatedAt,
    Guid? CreatedByUserId
);

public sealed record PlantThresholdDto(
    Guid Id,
    Guid PlantId,
    Guid ReadingTypeId,
    string? ReadingTypeCode,
    string? ReadingTypeName,
    Guid? UnitTypeId,
    string? UnitTypeCode,
    string? UnitTypeName,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? OptimalValue,
    bool IsActive,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);

public sealed record PlantEventDto(
    Guid Id,
    Guid ClientId,
    Guid PlantId,
    Guid EventTypeId,
    string? EventTypeCode,
    string? EventTypeName,
    string Title,
    string? Description,
    string? Notes,
    DateTime EventDate,
    bool IsActive,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);

public sealed record AnalyzePlantPhotosDto(
    string? SpeciesName,
    decimal? Confidence,
    string? HealthStatus,
    string? Observations,
    IReadOnlyList<string> PossibleIssues,
    IReadOnlyList<string> CareRecommendations
);

public sealed record PlantLatestReadingSummaryDto(
    Guid ReadingId,
    DateTime ReadAt,
    Guid DeviceId,
    string DeviceCode,
    string? Source
);

public sealed record PlantDetailDto(
    Guid Id,
    Guid ClientId,
    string? ClientCode,
    string? ClientName,
    Guid InstallationId,
    string? InstallationCode,
    string? InstallationName,
    string Code,
    string Name,
    string? Description,
    Guid? PlantTypeId,
    string? PlantTypeCode,
    string? PlantTypeName,
    Guid? PlantStatusId,
    string? PlantStatusCode,
    string? PlantStatusName,
    string? LightExposureCode,
    string? LightExposureLabel,
    string? SoilType,
    string? Fertilizer,
    IReadOnlyList<int> FloweringMonths,
    IReadOnlyList<string> FertilizationSeasons,
    bool IsActive,
    string? PrimaryPhotoUrl,
    int ThresholdsCount,
    int EventsCount,
    PlantLatestReadingSummaryDto? LatestReading,
    IReadOnlyList<PlantPhotoDto> Photos,
    IReadOnlyList<PlantThresholdDto> Thresholds,
    IReadOnlyList<PlantEventDto> Events,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
