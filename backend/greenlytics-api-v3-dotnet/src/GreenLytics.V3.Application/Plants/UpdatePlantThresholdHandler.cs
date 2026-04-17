using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class UpdatePlantThresholdHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public UpdatePlantThresholdHandler(
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

    public async Task<PlantThresholdDto> HandleAsync(UpdatePlantThresholdCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateThresholdAsync(command, cancellationToken);

        if (command.ReadingTypeId.HasValue)
        {
            validated.Threshold.ReadingTypeId = validated.ReadingTypeId;
        }

        if (command.UnitTypeId.HasValue)
        {
            validated.Threshold.UnitTypeId = validated.UnitTypeId;
        }

        if (command.MinValue.HasValue)
        {
            validated.Threshold.MinValue = command.MinValue.Value;
        }

        if (command.MaxValue.HasValue)
        {
            validated.Threshold.MaxValue = command.MaxValue.Value;
        }

        if (command.OptimalValue.HasValue)
        {
            validated.Threshold.OptimalValue = command.OptimalValue.Value;
        }

        if (validated.IsActive.HasValue)
        {
            validated.Threshold.IsActive = validated.IsActive.Value;
        }

        validated.Threshold.UpdatedAt = _clock.UtcNow;
        validated.Threshold.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var readingType = await _dbContext.Types.AsNoTracking().SingleAsync(x => x.Id == validated.Threshold.ReadingTypeId, cancellationToken);
        var unitType = validated.Threshold.UnitTypeId.HasValue
            ? await _dbContext.Types.AsNoTracking().SingleOrDefaultAsync(x => x.Id == validated.Threshold.UnitTypeId.Value, cancellationToken)
            : null;

        return validated.Threshold.ToThresholdDto(readingType.Code, readingType.Name, unitType?.Code, unitType?.Name);
    }
}
