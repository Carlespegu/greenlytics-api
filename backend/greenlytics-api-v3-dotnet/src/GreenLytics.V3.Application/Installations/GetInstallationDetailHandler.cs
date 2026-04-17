using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Installations;

public sealed class GetInstallationDetailHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly InstallationManagementValidationService _validationService;

    public GetInstallationDetailHandler(
        IAppDbContext dbContext,
        InstallationManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<InstallationDetailDto> HandleAsync(Guid clientId, Guid installationId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidateReadAsync(clientId, installationId, cancellationToken);

        var installation = await (
            from item in _dbContext.Installations.AsNoTracking()
            join client in _dbContext.Clients.AsNoTracking().Where(x => !x.IsDeleted)
                on item.ClientId equals client.Id into clientGroup
            from client in clientGroup.DefaultIfEmpty()
            where item.Id == installationId && item.ClientId == clientId && !item.IsDeleted
            select new
            {
                item.Id,
                item.ClientId,
                ClientCode = client != null ? client.Code : null,
                ClientName = client != null ? client.Name : null,
                item.Code,
                item.Name,
                item.Description,
                item.Location,
                item.IsActive,
                item.CreatedAt,
                item.CreatedByUserId,
                item.UpdatedAt,
                item.UpdatedByUserId
            })
            .SingleAsync(cancellationToken);

        var plantsCount = await _dbContext.Plants
            .AsNoTracking()
            .CountAsync(x => x.InstallationId == installationId && !x.IsDeleted, cancellationToken);

        var devicesCount = await _dbContext.Devices
            .AsNoTracking()
            .CountAsync(x => x.InstallationId == installationId && !x.IsDeleted, cancellationToken);

        var alertsCount = await _dbContext.Alerts
            .AsNoTracking()
            .CountAsync(x => x.InstallationId == installationId && !x.IsDeleted, cancellationToken);

        var latestReading = await (
            from reading in _dbContext.Readings.AsNoTracking()
            join device in _dbContext.Devices.AsNoTracking().Where(x => !x.IsDeleted)
                on reading.DeviceId equals device.Id
            where reading.InstallationId == installationId && !reading.IsDeleted
            orderby reading.ReadAt descending
            select new InstallationLatestReadingSummaryDto(
                reading.Id,
                reading.ReadAt,
                device.Id,
                device.Code))
            .FirstOrDefaultAsync(cancellationToken);

        return new InstallationDetailDto(
            installation.Id,
            installation.ClientId,
            installation.ClientCode,
            installation.ClientName,
            installation.Code,
            installation.Name,
            installation.Description,
            installation.Location,
            installation.IsActive,
            plantsCount,
            devicesCount,
            alertsCount,
            latestReading,
            installation.CreatedAt,
            installation.CreatedByUserId,
            installation.UpdatedAt,
            installation.UpdatedByUserId);
    }
}
