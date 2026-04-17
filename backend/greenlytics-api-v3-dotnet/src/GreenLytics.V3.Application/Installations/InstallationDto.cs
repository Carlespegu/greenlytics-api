namespace GreenLytics.V3.Application.Installations;

public sealed record InstallationListItemDto(
    Guid Id,
    Guid ClientId,
    string Code,
    string Name,
    string? Description,
    string? Location,
    bool IsActive,
    int PlantsCount,
    int DevicesCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public sealed record InstallationLatestReadingSummaryDto(
    Guid ReadingId,
    DateTime ReadAt,
    Guid DeviceId,
    string DeviceCode
);

public sealed record InstallationDetailDto(
    Guid Id,
    Guid ClientId,
    string? ClientCode,
    string? ClientName,
    string Code,
    string Name,
    string? Description,
    string? Location,
    bool IsActive,
    int PlantsCount,
    int DevicesCount,
    int AlertsCount,
    InstallationLatestReadingSummaryDto? LatestReading,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
