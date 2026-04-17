using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Plants;

public sealed class DeletePlantHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public DeletePlantHandler(
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

    public async Task HandleAsync(DeletePlantCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateDeleteAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        validated.Plant.IsDeleted = true;
        validated.Plant.DeletedAt = now;
        validated.Plant.DeletedByUserId = _currentUser.UserId;
        validated.Plant.UpdatedAt = now;
        validated.Plant.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
