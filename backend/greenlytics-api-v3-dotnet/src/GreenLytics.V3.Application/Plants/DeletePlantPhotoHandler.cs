using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Plants;

public sealed class DeletePlantPhotoHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public DeletePlantPhotoHandler(
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

    public async Task HandleAsync(DeletePlantPhotoCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidatePhotoScopeAsync(command.ClientId, command.PlantId, command.PhotoId, true, cancellationToken);
        var now = _clock.UtcNow;

        validated.Photo.IsDeleted = true;
        validated.Photo.IsPrimary = false;
        validated.Photo.DeletedAt = now;
        validated.Photo.DeletedByUserId = _currentUser.UserId;
        validated.Photo.UpdatedAt = now;
        validated.Photo.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
