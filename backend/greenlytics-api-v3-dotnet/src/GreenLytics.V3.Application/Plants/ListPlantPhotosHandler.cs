using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class ListPlantPhotosHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly PlantManagementValidationService _validationService;

    public ListPlantPhotosHandler(IAppDbContext dbContext, PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<IReadOnlyList<PlantPhotoDto>> HandleAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        _ = await _validationService.ValidatePhotoListAsync(clientId, plantId, cancellationToken);

        return await (
            from photo in _dbContext.Photos.AsNoTracking()
            join photoType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PhotoType" && !x.IsDeleted)
                on photo.PhotoTypeId equals photoType.Id into photoTypeGroup
            from photoType in photoTypeGroup.DefaultIfEmpty()
            where photo.PlantId == plantId && !photo.IsDeleted
            orderby photo.IsPrimary descending, photo.CreatedAt descending
            select photo.ToPhotoDto(
                photoType != null ? photoType.Code : null,
                photoType != null ? photoType.Name : null))
            .ToListAsync(cancellationToken);
    }
}
