using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class UpdatePlantEventHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public UpdatePlantEventHandler(
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

    public async Task<PlantEventDto> HandleAsync(UpdatePlantEventCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateEventAsync(command, cancellationToken);

        if (validated.EventTypeId.HasValue)
        {
            validated.Event.EventTypeId = validated.EventTypeId.Value;
        }

        if (validated.Title is not null)
        {
            validated.Event.Title = validated.Title;
        }

        if (command.Description is not null)
        {
            validated.Event.Description = validated.Description;
        }

        if (command.Notes is not null)
        {
            validated.Event.Notes = validated.Notes;
        }

        if (validated.EventDate.HasValue)
        {
            validated.Event.EventDate = validated.EventDate.Value;
        }

        if (validated.IsActive.HasValue)
        {
            validated.Event.IsActive = validated.IsActive.Value;
        }

        validated.Event.UpdatedAt = _clock.UtcNow;
        validated.Event.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var eventType = await _dbContext.Types.AsNoTracking().SingleAsync(x => x.Id == validated.Event.EventTypeId, cancellationToken);
        return validated.Event.ToEventDto(eventType.Code, eventType.Name);
    }
}
