using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class CreatePlantPhotoHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly PlantManagementValidationService _validationService;

    public CreatePlantPhotoHandler(
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

    public async Task<PlantPhotoDto> HandleAsync(CreatePlantPhotoCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreatePhotoAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        if (validated.IsPrimary)
        {
            var currentPrimaryPhotos = await _dbContext.Photos
                .Where(x => x.PlantId == validated.Plant.Id && !x.IsDeleted && x.IsPrimary)
                .ToListAsync(cancellationToken);

            foreach (var currentPrimary in currentPrimaryPhotos)
            {
                currentPrimary.IsPrimary = false;
                currentPrimary.UpdatedAt = now;
                currentPrimary.UpdatedByUserId = _currentUser.UserId;
            }
        }

        var photo = new Photo
        {
            Id = Guid.NewGuid(),
            PlantId = validated.Plant.Id,
            PhotoTypeId = validated.PhotoTypeId,
            FileName = validated.FileName,
            FileUrl = validated.FileUrl,
            IsPrimary = validated.IsPrimary,
            IsActive = validated.IsActive,
            CreatedAt = now,
            CreatedByUserId = _currentUser.UserId
        };

        _dbContext.Photos.Add(photo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var photoType = validated.PhotoTypeId.HasValue
            ? await _dbContext.Types.AsNoTracking().SingleOrDefaultAsync(x => x.Id == validated.PhotoTypeId.Value, cancellationToken)
            : null;

        return photo.ToPhotoDto(photoType?.Code, photoType?.Name);
    }
}
