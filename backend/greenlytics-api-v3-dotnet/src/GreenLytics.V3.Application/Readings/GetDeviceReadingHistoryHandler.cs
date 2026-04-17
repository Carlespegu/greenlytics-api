using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class GetDeviceReadingHistoryHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly DeviceReadingsValidationService _validationService;

    public GetDeviceReadingHistoryHandler(IAppDbContext dbContext, DeviceReadingsValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<IReadOnlyList<DeviceReadingResponse>> HandleAsync(string deviceCode, CancellationToken cancellationToken = default)
    {
        var device = await _validationService.ValidateDeviceCodeAsync(deviceCode, cancellationToken);

        var headers = await _dbContext.Readings
            .AsNoTracking()
            .Where(x => x.DeviceId == device.Id && !x.IsDeleted)
            .OrderByDescending(x => x.ReadAt)
            .Select(x => new
            {
                x.Id,
                x.DeviceId,
                x.ReadAt,
                x.Source
            })
            .ToArrayAsync(cancellationToken);

        if (headers.Length == 0)
        {
            return Array.Empty<DeviceReadingResponse>();
        }

        var readingIds = headers.Select(x => x.Id).ToArray();

        var values = await (
            from readingValue in _dbContext.ReadingValues.AsNoTracking()
            join readingType in _dbContext.Types.AsNoTracking() on readingValue.ReadingTypeId equals readingType.Id
            join unitType in _dbContext.Types.AsNoTracking() on readingValue.UnitTypeId equals unitType.Id into unitTypes
            from unitType in unitTypes.DefaultIfEmpty()
            where readingIds.Contains(readingValue.ReadingId) && !readingValue.IsDeleted
            select new
            {
                readingValue.ReadingId,
                Value = new ReadingValueDto(
                    readingType.Id,
                    readingType.Code,
                    unitType != null ? unitType.Code : null,
                    readingValue.Value)
            })
            .ToArrayAsync(cancellationToken);

        var valuesByReadingId = values
            .GroupBy(x => x.ReadingId)
            .ToDictionary(x => x.Key, x => (IReadOnlyList<ReadingValueDto>)x.Select(v => v.Value).ToArray());

        return headers
            .Select(header => new DeviceReadingResponse(
                header.Id,
                header.DeviceId,
                device.Code,
                header.ReadAt,
                header.Source,
                valuesByReadingId.TryGetValue(header.Id, out var readingValues) ? readingValues : Array.Empty<ReadingValueDto>()))
            .ToArray();
    }
}
