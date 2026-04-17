using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Devices;

public sealed class GetDeviceDetailHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly DeviceManagementValidationService _validationService;

    public GetDeviceDetailHandler(
        IAppDbContext dbContext,
        DeviceManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<DeviceDetailDto> HandleAsync(Guid clientId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidateReadAsync(clientId, deviceId, cancellationToken);

        var device = await (
            from item in _dbContext.Devices.AsNoTracking()
            join client in _dbContext.Clients.AsNoTracking().Where(x => !x.IsDeleted)
                on item.ClientId equals client.Id into clientGroup
            from client in clientGroup.DefaultIfEmpty()
            join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
                on item.InstallationId equals installation.Id into installationGroup
            from installation in installationGroup.DefaultIfEmpty()
            join deviceType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "DeviceType" && !x.IsDeleted)
                on item.DeviceTypeId equals deviceType.Id into deviceTypeGroup
            from deviceType in deviceTypeGroup.DefaultIfEmpty()
            where item.Id == deviceId && item.ClientId == clientId && !item.IsDeleted
            select new
            {
                item.Id,
                item.ClientId,
                ClientCode = client != null ? client.Code : null,
                ClientName = client != null ? client.Name : null,
                item.InstallationId,
                InstallationCode = installation != null ? installation.Code : null,
                InstallationName = installation != null ? installation.Name : null,
                item.DeviceTypeId,
                DeviceTypeCode = deviceType != null ? deviceType.Code : null,
                DeviceTypeName = deviceType != null ? deviceType.Name : null,
                item.Code,
                item.Name,
                item.SerialNumber,
                item.FirmwareVersion,
                item.LastSeenAt,
                item.LastAuthenticatedAt,
                item.SecretRotatedAt,
                HasSecretConfigured = item.DeviceSecretHash != null && item.DeviceSecretHash != string.Empty,
                item.IsActive,
                item.CreatedAt,
                item.CreatedByUserId,
                item.UpdatedAt,
                item.UpdatedByUserId
            })
            .SingleAsync(cancellationToken);

        var latestReading = await _dbContext.Readings
            .AsNoTracking()
            .Where(x => x.DeviceId == deviceId && !x.IsDeleted)
            .OrderByDescending(x => x.ReadAt)
            .Select(x => new DeviceLatestReadingSummaryDto(x.Id, x.ReadAt, x.Source))
            .FirstOrDefaultAsync(cancellationToken);

        return new DeviceDetailDto(
            device.Id,
            device.ClientId,
            device.ClientCode,
            device.ClientName,
            device.InstallationId,
            device.InstallationCode,
            device.InstallationName,
            device.DeviceTypeId,
            device.DeviceTypeCode,
            device.DeviceTypeName,
            device.Code,
            device.Name,
            device.SerialNumber,
            device.FirmwareVersion,
            device.LastSeenAt,
            device.LastAuthenticatedAt,
            device.SecretRotatedAt,
            device.HasSecretConfigured,
            device.IsActive,
            latestReading,
            device.CreatedAt,
            device.CreatedByUserId,
            device.UpdatedAt,
            device.UpdatedByUserId);
    }
}
