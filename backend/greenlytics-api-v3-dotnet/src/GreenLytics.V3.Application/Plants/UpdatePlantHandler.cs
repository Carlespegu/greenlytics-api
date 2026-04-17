using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Plants;

public sealed class UpdatePlantHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;
    private readonly GetPlantDetailHandler _getPlantDetailHandler;

    public UpdatePlantHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        PlantManagementValidationService validationService,
        GetPlantDetailHandler getPlantDetailHandler)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
        _getPlantDetailHandler = getPlantDetailHandler;
    }

    public async Task<PlantDetailDto> HandleAsync(UpdatePlantCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);

        if (validated.Installation is not null)
        {
            validated.Plant.InstallationId = validated.Installation.Id;
            validated.Plant.ClientId = validated.Installation.ClientId;
        }

        if (validated.Code is not null)
        {
            validated.Plant.Code = validated.Code;
        }

        if (validated.Name is not null)
        {
            validated.Plant.Name = validated.Name;
        }

        if (command.Description is not null)
        {
            validated.Plant.Description = validated.Description;
        }

        if (command.PlantTypeId.HasValue)
        {
            validated.Plant.PlantTypeId = validated.PlantTypeId;
        }

        if (command.PlantStatusId.HasValue)
        {
            validated.Plant.PlantStatusId = validated.PlantStatusId;
        }

        if (validated.IsActive.HasValue)
        {
            validated.Plant.IsActive = validated.IsActive.Value;
        }

        validated.Plant.UpdatedAt = _clock.UtcNow;
        validated.Plant.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getPlantDetailHandler.HandleAsync(command.ClientId, validated.Plant.Id, cancellationToken);
    }
}
