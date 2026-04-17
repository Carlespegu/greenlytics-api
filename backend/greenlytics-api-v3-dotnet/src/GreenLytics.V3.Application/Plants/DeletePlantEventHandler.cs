using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Plants;

public sealed class DeletePlantEventHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public DeletePlantEventHandler(
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

    public async Task HandleAsync(DeletePlantEventCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateEventScopeAsync(command.ClientId, command.PlantId, command.EventId, true, cancellationToken);
        var now = _clock.UtcNow;

        validated.Event.IsDeleted = true;
        validated.Event.DeletedAt = now;
        validated.Event.DeletedByUserId = _currentUser.UserId;
        validated.Event.UpdatedAt = now;
        validated.Event.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
