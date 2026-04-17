using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class SearchReadingsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ReadingsManagementValidationService _validationService;

    public SearchReadingsHandler(IAppDbContext dbContext, ReadingsManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<ReadingResponse>> HandleAsync(ReadingsSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query =
            from reading in _dbContext.Readings.AsNoTracking()
            join device in _dbContext.Devices.AsNoTracking() on reading.DeviceId equals device.Id into deviceGroup
            from device in deviceGroup.DefaultIfEmpty()
            join installation in _dbContext.Installations.AsNoTracking() on reading.InstallationId equals installation.Id into installationGroup
            from installation in installationGroup.DefaultIfEmpty()
            select new ReadingHeaderRow(
                reading.Id,
                reading.ClientId,
                reading.DeviceId,
                device != null ? device.Code : null,
                device != null ? device.Name : null,
                reading.InstallationId,
                installation != null ? installation.Code : null,
                installation != null ? installation.Name : null,
                reading.ReadAt,
                reading.Source,
                reading.CreatedAt);

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (validated.DeviceId.HasValue)
        {
            query = query.Where(x => x.DeviceId == validated.DeviceId.Value);
        }

        if (validated.PlantId.HasValue)
        {
            query = query.Where(_ => false);
        }

        if (validated.InstallationId.HasValue)
        {
            query = query.Where(x => x.InstallationId == validated.InstallationId.Value);
        }

        if (validated.ReadingTypeId.HasValue)
        {
            var readingTypeId = validated.ReadingTypeId.Value;
            query = query.Where(x => _dbContext.ReadingValues.AsNoTracking().Any(rv => rv.ReadingId == x.ReadingId && rv.ReadingTypeId == readingTypeId && !rv.IsDeleted));
        }

        if (validated.DateFrom.HasValue)
        {
            query = query.Where(x => x.ReadAt >= validated.DateFrom.Value);
        }

        if (validated.DateTo.HasValue)
        {
            query = query.Where(x => x.ReadAt <= validated.DateTo.Value);
        }

        if (validated.ValueMin.HasValue || validated.ValueMax.HasValue)
        {
            var min = validated.ValueMin;
            var max = validated.ValueMax;
            query = query.Where(x => _dbContext.ReadingValues.AsNoTracking().Any(rv =>
                rv.ReadingId == x.ReadingId
                && !rv.IsDeleted
                && (!min.HasValue || rv.Value >= min.Value)
                && (!max.HasValue || rv.Value <= max.Value)));
        }

        query = validated.Sort.Field switch
        {
            "createdAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
            "value" => validated.Sort.Descending
                ? query.OrderByDescending(x => _dbContext.ReadingValues.AsNoTracking().Where(rv => rv.ReadingId == x.ReadingId && !rv.IsDeleted).Max(rv => (decimal?)rv.Value))
                    .ThenByDescending(x => x.ReadAt)
                : query.OrderBy(x => _dbContext.ReadingValues.AsNoTracking().Where(rv => rv.ReadingId == x.ReadingId && !rv.IsDeleted).Min(rv => (decimal?)rv.Value))
                    .ThenBy(x => x.ReadAt),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.ReadAt) : query.OrderBy(x => x.ReadAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var headers = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToArrayAsync(cancellationToken);

        var readingIds = headers.Select(x => x.ReadingId).ToArray();
        var valueRows = await (
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

        var valuesByReadingId = valueRows
            .GroupBy(x => x.ReadingId)
            .ToDictionary(x => x.Key, x => (IReadOnlyList<ReadingValueDto>)x.Select(v => v.Value).ToArray());

        var items = headers
            .Select(header => header.ToResponse(valuesByReadingId.TryGetValue(header.ReadingId, out var values) ? values : Array.Empty<ReadingValueDto>()))
            .ToArray();

        return SearchRequestValidation.ToPagedResult(items, validated.Pagination, totalItems);
    }
}
