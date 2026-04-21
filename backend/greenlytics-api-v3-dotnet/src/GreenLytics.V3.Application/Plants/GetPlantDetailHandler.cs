using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class GetPlantDetailHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly PlantManagementValidationService _validationService;

    public GetPlantDetailHandler(
        IAppDbContext dbContext,
        PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PlantDetailDto> HandleAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidateReadAsync(clientId, plantId, cancellationToken);

        var plant = await (
            from item in _dbContext.Plants.AsNoTracking()
            join client in _dbContext.Clients.AsNoTracking().Where(x => !x.IsDeleted)
                on item.ClientId equals client.Id into clientGroup
            from client in clientGroup.DefaultIfEmpty()
            join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
                on item.InstallationId equals installation.Id into installationGroup
            from installation in installationGroup.DefaultIfEmpty()
            join plantType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantType" && !x.IsDeleted)
                on item.PlantTypeId equals plantType.Id into plantTypeGroup
            from plantType in plantTypeGroup.DefaultIfEmpty()
            join plantStatus in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantStatus" && !x.IsDeleted)
                on item.PlantStatusId equals plantStatus.Id into plantStatusGroup
            from plantStatus in plantStatusGroup.DefaultIfEmpty()
            where item.Id == plantId && item.ClientId == clientId && !item.IsDeleted
            select new
            {
                item.Id,
                item.ClientId,
                ClientCode = client != null ? client.Code : null,
                ClientName = client != null ? client.Name : null,
                item.InstallationId,
                InstallationCode = installation != null ? installation.Code : null,
                InstallationName = installation != null ? installation.Name : null,
                item.Code,
                item.Name,
                item.Description,
                item.PlantTypeId,
                PlantTypeCode = plantType != null ? plantType.Code : null,
                PlantTypeName = plantType != null ? plantType.Name : null,
                item.PlantStatusId,
                PlantStatusCode = plantStatus != null ? plantStatus.Code : null,
                PlantStatusName = plantStatus != null ? plantStatus.Name : null,
                item.LightExposureCode,
                item.LightExposureLabel,
                item.SoilType,
                item.Fertilizer,
                item.FloweringMonths,
                item.FertilizationSeasons,
                item.IsActive,
                item.CreatedAt,
                item.CreatedByUserId,
                item.UpdatedAt,
                item.UpdatedByUserId
            })
            .SingleAsync(cancellationToken);

        var photos = await (
            from photo in _dbContext.Photos.AsNoTracking()
            join photoType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PhotoType" && !x.IsDeleted)
                on photo.PhotoTypeId equals photoType.Id into photoTypeGroup
            from photoType in photoTypeGroup.DefaultIfEmpty()
            where photo.PlantId == plantId && !photo.IsDeleted
            orderby photo.IsPrimary descending, photo.CreatedAt descending
            select photo.ToPhotoDto(
                photoType != null ? photoType.Code : null,
                photoType != null ? photoType.Name : null))
            .ToListAsync(cancellationToken);

        var thresholds = await (
            from threshold in _dbContext.PlantThresholds.AsNoTracking()
            join readingType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "ReadingType" && !x.IsDeleted)
                on threshold.ReadingTypeId equals readingType.Id into readingTypeGroup
            from readingType in readingTypeGroup.DefaultIfEmpty()
            join unitType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "UnitType" && !x.IsDeleted)
                on threshold.UnitTypeId equals unitType.Id into unitTypeGroup
            from unitType in unitTypeGroup.DefaultIfEmpty()
            where threshold.PlantId == plantId && !threshold.IsDeleted
            orderby readingType != null ? readingType.SortOrder : int.MaxValue, readingType != null ? readingType.Name : threshold.ReadingTypeId.ToString()
            select threshold.ToThresholdDto(
                readingType != null ? readingType.Code : null,
                readingType != null ? readingType.Name : null,
                unitType != null ? unitType.Code : null,
                unitType != null ? unitType.Name : null))
            .ToListAsync(cancellationToken);

        var events = await (
            from plantEvent in _dbContext.PlantEvents.AsNoTracking()
            join eventType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantEventType" && !x.IsDeleted)
                on plantEvent.EventTypeId equals eventType.Id into eventTypeGroup
            from eventType in eventTypeGroup.DefaultIfEmpty()
            where plantEvent.PlantId == plantId && !plantEvent.IsDeleted
            orderby plantEvent.EventDate descending, plantEvent.CreatedAt descending
            select plantEvent.ToEventDto(
                eventType != null ? eventType.Code : null,
                eventType != null ? eventType.Name : null))
            .ToListAsync(cancellationToken);

        var latestReading = await (
            from reading in _dbContext.Readings.AsNoTracking()
            join device in _dbContext.Devices.AsNoTracking().Where(x => !x.IsDeleted)
                on reading.DeviceId equals device.Id
            where reading.InstallationId == plant.InstallationId && !reading.IsDeleted
            orderby reading.ReadAt descending
            select new PlantLatestReadingSummaryDto(
                reading.Id,
                reading.ReadAt,
                device.Id,
                device.Code,
                reading.Source))
            .FirstOrDefaultAsync(cancellationToken);

        return new PlantDetailDto(
            plant.Id,
            plant.ClientId,
            plant.ClientCode,
            plant.ClientName,
            plant.InstallationId,
            plant.InstallationCode,
            plant.InstallationName,
            plant.Code,
            plant.Name,
            plant.Description,
            plant.PlantTypeId,
            plant.PlantTypeCode,
            plant.PlantTypeName,
            plant.PlantStatusId,
            plant.PlantStatusCode,
            plant.PlantStatusName,
            plant.LightExposureCode,
            plant.LightExposureLabel,
            plant.SoilType,
            plant.Fertilizer,
            plant.FloweringMonths ?? Array.Empty<int>(),
            plant.FertilizationSeasons ?? Array.Empty<string>(),
            plant.IsActive,
            photos.FirstOrDefault(x => x.IsPrimary)?.FileUrl,
            thresholds.Count,
            events.Count,
            latestReading,
            photos,
            thresholds,
            events,
            plant.CreatedAt,
            plant.CreatedByUserId,
            plant.UpdatedAt,
            plant.UpdatedByUserId);
    }
}
