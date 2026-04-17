namespace GreenLytics.V3.Application.Readings;

public record DeviceReadingRequest(
    string? DeviceCode,
    string? DeviceSecret,
    DateTime? ReadAt,
    string? Source,
    IReadOnlyList<DeviceReadingValueRequest>? Values
);

public record DeviceReadingValueRequest(
    string? Type,
    decimal? Value,
    string? Unit
);

public sealed record DeviceReadingsIngestRequest(
    string? DeviceCode,
    string? DeviceSecret,
    DateTime? ReadAt,
    string? Source,
    IReadOnlyList<DeviceReadingValueRequest>? Values
) : DeviceReadingRequest(DeviceCode, DeviceSecret, ReadAt, Source, Values);

public sealed record DeviceReadingValueInput(
    string? Type,
    decimal? Value,
    string? Unit
) : DeviceReadingValueRequest(Type, Value, Unit);

public record DeviceReadingResponse(
    Guid ReadingId,
    Guid DeviceId,
    string DeviceCode,
    DateTime ReadAt,
    string? Source,
    IReadOnlyList<ReadingValueDto> Values
);

public sealed record DeviceReadingsIngestResult(
    Guid ReadingId,
    Guid DeviceId,
    string DeviceCode,
    DateTime ReadAt,
    string? Source,
    IReadOnlyList<ReadingValueDto> Values
) : DeviceReadingResponse(ReadingId, DeviceId, DeviceCode, ReadAt, Source, Values);

public sealed record LatestDeviceReadingDto(
    Guid ReadingId,
    Guid DeviceId,
    string DeviceCode,
    DateTime ReadAt,
    string? Source,
    IReadOnlyList<ReadingValueDto> Values
) : DeviceReadingResponse(ReadingId, DeviceId, DeviceCode, ReadAt, Source, Values);

public sealed record ValidatedDeviceReadingsIngestRequest(
    Domain.Entities.Device Device,
    DateTime ReadAt,
    string? Source,
    IReadOnlyList<ValidatedDeviceReadingValue> Values
);

public sealed record ValidatedDeviceReadingValue(
    Domain.Entities.TypeCatalog ReadingType,
    Domain.Entities.TypeCatalog? UnitType,
    decimal Value
);
