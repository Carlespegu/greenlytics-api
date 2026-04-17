using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class SetPlantPhotoPrimaryHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public SetPlantPhotoPrimaryHandler(
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

    public async Task<PlantPhotoDto> HandleAsync(SetPlantPhotoPrimaryCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidatePhotoScopeAsync(command.ClientId, command.PlantId, command.PhotoId, true, cancellationToken);
        var now = _clock.UtcNow;

        var plantPhotos = await _dbContext.Photos
            .Where(x => x.PlantId == command.PlantId && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var photo in plantPhotos)
        {
            var shouldBePrimary = photo.Id == command.PhotoId;
            if (photo.IsPrimary != shouldBePrimary)
            {
                photo.IsPrimary = shouldBePrimary;
                photo.UpdatedAt = now;
                photo.UpdatedByUserId = _currentUser.UserId;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var photoType = validated.Photo.PhotoTypeId.HasValue
            ? await _dbContext.Types.AsNoTracking().SingleOrDefaultAsync(x => x.Id == validated.Photo.PhotoTypeId.Value, cancellationToken)
            : null;

        validated.Photo.IsPrimary = true;
        return validated.Photo.ToPhotoDto(photoType?.Code, photoType?.Name);
    }
}
