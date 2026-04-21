using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Plants;

public sealed class CreatePlantHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;
    private readonly GetPlantDetailHandler _getPlantDetailHandler;

    public CreatePlantHandler(
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

    public async Task<PlantDetailDto> HandleAsync(CreatePlantCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        var plant = new Plant
        {
            Id = Guid.NewGuid(),
            ClientId = validated.ClientId,
            InstallationId = validated.Installation.Id,
            Code = validated.Code,
            Name = validated.Name,
            Description = validated.Description,
            PlantTypeId = validated.PlantTypeId,
            PlantStatusId = validated.PlantStatusId,
            FloweringMonths = validated.FloweringMonths.ToArray(),
            FertilizationSeasons = validated.FertilizationSeasons.ToArray(),
            IsActive = validated.IsActive,
            CreatedAt = now,
            CreatedByUserId = _currentUser.UserId
        };

        _dbContext.Plants.Add(plant);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getPlantDetailHandler.HandleAsync(validated.ClientId, plant.Id, cancellationToken);
    }
}
