namespace GreenLytics.V3.Application.Devices;

public sealed record DeviceListItemDto(
    Guid Id,
    Guid ClientId,
    Guid InstallationId,
    Guid DeviceTypeId,
    string Code,
    string Name,
    string? SerialNumber,
    string? FirmwareVersion,
    DateTime? LastSeenAt,
    DateTime? LastAuthenticatedAt,
    bool IsActive,
    bool HasSecretConfigured,
    string? InstallationName,
    string? DeviceTypeName,
    DateTime? LatestReadingAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public sealed record DeviceLatestReadingSummaryDto(
    Guid ReadingId,
    DateTime ReadAt,
    string? Source
);

public sealed record DeviceDetailDto(
    Guid Id,
    Guid ClientId,
    string? ClientCode,
    string? ClientName,
    Guid InstallationId,
    string? InstallationCode,
    string? InstallationName,
    Guid DeviceTypeId,
    string? DeviceTypeCode,
    string? DeviceTypeName,
    string Code,
    string Name,
    string? SerialNumber,
    string? FirmwareVersion,
    DateTime? LastSeenAt,
    DateTime? LastAuthenticatedAt,
    DateTime? SecretRotatedAt,
    bool HasSecretConfigured,
    bool IsActive,
    DeviceLatestReadingSummaryDto? LatestReading,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
