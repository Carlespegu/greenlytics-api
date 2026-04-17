using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class ListPlantEventsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly PlantManagementValidationService _validationService;

    public ListPlantEventsHandler(IAppDbContext dbContext, PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<IReadOnlyList<PlantEventDto>> HandleAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidateEventListAsync(clientId, plantId, cancellationToken);

        return await (
            from plantEvent in _dbContext.PlantEvents.AsNoTracking()
            join eventType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantEventType" && !x.IsDeleted)
                on plantEvent.EventTypeId equals eventType.Id into eventTypeGroup
            from eventType in eventTypeGroup.DefaultIfEmpty()
            where plantEvent.PlantId == plantId && !plantEvent.IsDeleted
            orderby plantEvent.EventDate descending, plantEvent.CreatedAt descending
            select plantEvent.ToEventDto(
                eventType != null ? eventType.Code : null,
                eventType != null ? eventType.Name : null))
            .ToListAsync(cancellationToken);
    }
}
