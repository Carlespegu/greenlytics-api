namespace GreenLytics.V3.Application.Readings;

public sealed record ReadingValueDto(
    Guid ReadingTypeId,
    string Type,
    string? Unit,
    decimal Value
);

public sealed record ReadingResponse(
    Guid ReadingId,
    Guid ClientId,
    Guid DeviceId,
    string? DeviceCode,
    string? DeviceName,
    Guid? InstallationId,
    string? InstallationCode,
    string? InstallationName,
    DateTime ReadAt,
    string? Source,
    DateTime CreatedAt,
    IReadOnlyList<ReadingValueDto> Values
);

public sealed record ReadingsIngestResult(
    Guid DeviceId,
    string DeviceCode,
    int BatchSize,
    int CreatedCount,
    IReadOnlyList<Guid> ReadingIds,
    DateTime? SentAt,
    DateTime ProcessedAt
);

public sealed record ReadingsTimeseriesPointDto(
    DateTime Bucket,
    decimal? Avg,
    decimal? Min,
    decimal? Max,
    int Count
);
