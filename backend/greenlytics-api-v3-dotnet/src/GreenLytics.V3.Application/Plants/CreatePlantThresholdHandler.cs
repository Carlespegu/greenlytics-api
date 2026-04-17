using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class CreatePlantThresholdHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public CreatePlantThresholdHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task<PlantThresholdDto> HandleAsync(CreatePlantThresholdCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateThresholdAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        var threshold = new PlantThreshold
        {
            Id = Guid.NewGuid(),
            PlantId = validated.Plant.Id,
            ReadingTypeId = validated.ReadingTypeId,
            UnitTypeId = validated.UnitTypeId,
            MinValue = validated.MinValue,
            MaxValue = validated.MaxValue,
            OptimalValue = validated.OptimalValue,
            IsActive = validated.IsActive,
            CreatedAt = now,
            CreatedByUserId = _currentUser.UserId
        };

        _dbContext.PlantThresholds.Add(threshold);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var readingType = await _dbContext.Types.AsNoTracking().SingleAsync(x => x.Id == threshold.ReadingTypeId, cancellationToken);
        var unitType = threshold.UnitTypeId.HasValue
            ? await _dbContext.Types.AsNoTracking().SingleOrDefaultAsync(x => x.Id == threshold.UnitTypeId.Value, cancellationToken)
            : null;

        return threshold.ToThresholdDto(readingType.Code, readingType.Name, unitType?.Code, unitType?.Name);
    }
}
