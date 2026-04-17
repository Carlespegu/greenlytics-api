using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class CreatePlantEventHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public CreatePlantEventHandler(
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

    public async Task<PlantEventDto> HandleAsync(CreatePlantEventCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateEventAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        var plantEvent = new PlantEvent
        {
            Id = Guid.NewGuid(),
            ClientId = validated.Plant.ClientId,
            PlantId = validated.Plant.Id,
            EventTypeId = validated.EventTypeId,
            Title = validated.Title,
            Description = validated.Description,
            Notes = validated.Notes,
            EventDate = validated.EventDate,
            IsActive = validated.IsActive,
            CreatedAt = now,
            CreatedByUserId = _currentUser.UserId
        };

        _dbContext.PlantEvents.Add(plantEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var eventType = await _dbContext.Types.AsNoTracking().SingleAsync(x => x.Id == plantEvent.EventTypeId, cancellationToken);
        return plantEvent.ToEventDto(eventType.Code, eventType.Name);
    }
}
