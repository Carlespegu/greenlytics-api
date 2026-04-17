using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class GetLatestDeviceReadingHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly DeviceReadingsValidationService _validationService;

    public GetLatestDeviceReadingHandler(IAppDbContext dbContext, DeviceReadingsValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<LatestDeviceReadingDto> HandleAsync(string deviceCode, CancellationToken cancellationToken = default)
    {
        var device = await _validationService.ValidateDeviceCodeAsync(deviceCode, cancellationToken);

        var latestReading = await _dbContext.Readings
            .AsNoTracking()
            .Where(x => x.DeviceId == device.Id && !x.IsDeleted)
            .OrderByDescending(x => x.ReadAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestReading is null)
        {
            throw new EntityNotFoundException("No readings were found for the requested device.");
        }

        var values = await (
            from readingValue in _dbContext.ReadingValues.AsNoTracking()
            join readingType in _dbContext.Types.AsNoTracking() on readingValue.ReadingTypeId equals readingType.Id
            join unitType in _dbContext.Types.AsNoTracking() on readingValue.UnitTypeId equals unitType.Id into unitTypes
            from unitType in unitTypes.DefaultIfEmpty()
            where readingValue.ReadingId == latestReading.Id && !readingValue.IsDeleted
            select new ReadingValueDto(
                readingType.Id,
                readingType.Code,
                unitType != null ? unitType.Code : null,
                readingValue.Value))
            .ToArrayAsync(cancellationToken);

        return new LatestDeviceReadingDto(
            latestReading.Id,
            device.Id,
            device.Code,
            latestReading.ReadAt,
            latestReading.Source,
            values);
    }
}
