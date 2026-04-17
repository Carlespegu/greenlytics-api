using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Devices;

public sealed record CreateDeviceCommand(
    Guid ClientId,
    Guid InstallationId,
    Guid DeviceTypeId,
    string Code,
    string Name,
    string? SerialNumber,
    string? FirmwareVersion,
    bool? IsActive
);

public sealed record UpdateDeviceCommand(
    Guid ClientId,
    Guid DeviceId,
    Guid? InstallationId,
    Guid? DeviceTypeId,
    string? Code,
    string? Name,
    string? SerialNumber,
    string? FirmwareVersion,
    bool? IsActive
);

public sealed record DeleteDeviceCommand(
    Guid ClientId,
    Guid DeviceId
);

public sealed record RotateDeviceSecretCommand(
    Guid ClientId,
    Guid DeviceId
);

public sealed record DevicesSearchRequest(
    DeviceSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record DeviceSearchFilters(
    string? Code,
    string? Name,
    string? SerialNumber,
    string? FirmwareVersion,
    Guid? ClientId,
    Guid? InstallationId,
    Guid? DeviceTypeId,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);
