using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class ListPlantThresholdsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly PlantManagementValidationService _validationService;

    public ListPlantThresholdsHandler(IAppDbContext dbContext, PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<IReadOnlyList<PlantThresholdDto>> HandleAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidateThresholdListAsync(clientId, plantId, cancellationToken);

        return await (
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
    }
}
