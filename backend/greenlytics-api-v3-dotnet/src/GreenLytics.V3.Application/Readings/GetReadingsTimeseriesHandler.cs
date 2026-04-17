using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class GetReadingsTimeseriesHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ReadingsManagementValidationService _validationService;

    public GetReadingsTimeseriesHandler(IAppDbContext dbContext, ReadingsManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<IReadOnlyList<ReadingsTimeseriesPointDto>> HandleAsync(ReadingsTimeseriesRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateTimeseriesAsync(request, cancellationToken);

        var query =
            from reading in _dbContext.Readings.AsNoTracking()
            join readingValue in _dbContext.ReadingValues.AsNoTracking() on reading.Id equals readingValue.ReadingId
            where readingValue.ReadingTypeId == validated.ReadingTypeId
            select new
            {
                ClientId = reading.ClientId,
                reading.DeviceId,
                reading.InstallationId,
                PlantId = (Guid?)null,
                ReadAt = reading.ReadAt,
                NumericValue = (decimal?)readingValue.Value
            };

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (validated.DeviceId.HasValue)
        {
            query = query.Where(x => x.DeviceId == validated.DeviceId.Value);
        }

        if (validated.InstallationId.HasValue)
        {
            query = query.Where(x => x.InstallationId == validated.InstallationId.Value);
        }

        if (validated.PlantId.HasValue)
        {
            query = query.Where(x => x.PlantId == validated.PlantId.Value);
        }

        query = query.Where(x => x.ReadAt >= validated.DateFrom && x.ReadAt <= validated.DateTo && x.NumericValue.HasValue);

        var points = await query.Select(x => new TimeseriesValuePoint(x.ReadAt, x.NumericValue!.Value)).ToArrayAsync(cancellationToken);
        return points
            .GroupBy(point => CreateBucket(point.ReadAt, validated.GroupBy))
            .OrderBy(group => group.Key)
            .Select(group => new ReadingsTimeseriesPointDto(
                group.Key,
                validated.Metrics.Contains("avg") ? decimal.Round(group.Average(x => x.Value), 2) : null,
                validated.Metrics.Contains("min") ? group.Min(x => x.Value) : null,
                validated.Metrics.Contains("max") ? group.Max(x => x.Value) : null,
                group.Count()))
            .ToArray();
    }

    private static DateTime CreateBucket(DateTime timestamp, string groupBy)
    {
        var utc = timestamp.Kind == DateTimeKind.Utc ? timestamp : timestamp.ToUniversalTime();
        return groupBy == "day"
            ? new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc)
            : new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, 0, 0, DateTimeKind.Utc);
    }

    private sealed record TimeseriesValuePoint(DateTime ReadAt, decimal Value);
}
