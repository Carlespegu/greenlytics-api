using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Plants;

public sealed class DeletePlantThresholdHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public DeletePlantThresholdHandler(
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

    public async Task HandleAsync(DeletePlantThresholdCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateThresholdScopeAsync(command.ClientId, command.PlantId, command.ThresholdId, true, cancellationToken);
        var now = _clock.UtcNow;

        validated.Threshold.IsDeleted = true;
        validated.Threshold.DeletedAt = now;
        validated.Threshold.DeletedByUserId = _currentUser.UserId;
        validated.Threshold.UpdatedAt = now;
        validated.Threshold.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
