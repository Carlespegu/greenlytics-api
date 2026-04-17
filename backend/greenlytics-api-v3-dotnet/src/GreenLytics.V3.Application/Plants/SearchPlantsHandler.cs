using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class SearchPlantsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly PlantManagementValidationService _validationService;

    public SearchPlantsHandler(
        IAppDbContext dbContext,
        PlantManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<PlantListItemDto>> HandleAsync(PlantsSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query =
            from plant in _dbContext.Plants.AsNoTracking()
            join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
                on plant.InstallationId equals installation.Id into installationGroup
            from installation in installationGroup.DefaultIfEmpty()
            join plantType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantType" && !x.IsDeleted)
                on plant.PlantTypeId equals plantType.Id into plantTypeGroup
            from plantType in plantTypeGroup.DefaultIfEmpty()
            join plantStatus in _dbContext.Types.AsNoTracking().Where(x => x.Category == "PlantStatus" && !x.IsDeleted)
                on plant.PlantStatusId equals plantStatus.Id into plantStatusGroup
            from plantStatus in plantStatusGroup.DefaultIfEmpty()
            join primaryPhoto in _dbContext.Photos.AsNoTracking().Where(x => !x.IsDeleted && x.IsPrimary)
                on plant.Id equals primaryPhoto.PlantId into primaryPhotoGroup
            from primaryPhoto in primaryPhotoGroup.DefaultIfEmpty()
            where !plant.IsDeleted
            select new
            {
                plant.Id,
                plant.ClientId,
                plant.InstallationId,
                plant.Code,
                plant.Name,
                plant.Description,
                plant.PlantTypeId,
                plant.PlantStatusId,
                plant.IsActive,
                InstallationName = installation != null ? installation.Name : null,
                PlantTypeName = plantType != null ? plantType.Name : null,
                PlantStatusName = plantStatus != null ? plantStatus.Name : null,
                PrimaryPhotoUrl = primaryPhoto != null ? primaryPhoto.FileUrl : null,
                plant.CreatedAt,
                plant.UpdatedAt
            };

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Code))
        {
            var searchCode = validated.Code.ToLowerInvariant();
            query = query.Where(x => x.Code.ToLower().Contains(searchCode));
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            var searchName = validated.Name.ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(searchName));
        }

        if (!string.IsNullOrWhiteSpace(validated.Description))
        {
            var searchDescription = validated.Description.ToLowerInvariant();
            query = query.Where(x => x.Description != null && x.Description.ToLower().Contains(searchDescription));
        }

        if (validated.InstallationId.HasValue)
        {
            query = query.Where(x => x.InstallationId == validated.InstallationId.Value);
        }

        if (validated.PlantTypeId.HasValue)
        {
            query = query.Where(x => x.PlantTypeId == validated.PlantTypeId.Value);
        }

        if (validated.PlantStatusId.HasValue)
        {
            query = query.Where(x => x.PlantStatusId == validated.PlantStatusId.Value);
        }

        if (validated.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == validated.IsActive.Value);
        }

        if (validated.CreatedAtFrom.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= validated.CreatedAtFrom.Value);
        }

        if (validated.CreatedAtTo.HasValue)
        {
            query = query.Where(x => x.CreatedAt <= validated.CreatedAtTo.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = validated.Sort.Field switch
        {
            "code" => validated.Sort.Descending ? query.OrderByDescending(x => x.Code).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.Code).ThenBy(x => x.CreatedAt),
            "name" => validated.Sort.Descending ? query.OrderByDescending(x => x.Name).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.Name).ThenBy(x => x.CreatedAt),
            "description" => validated.Sort.Descending ? query.OrderByDescending(x => x.Description).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.Description).ThenBy(x => x.CreatedAt),
            "installationName" => validated.Sort.Descending ? query.OrderByDescending(x => x.InstallationName).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.InstallationName).ThenBy(x => x.CreatedAt),
            "plantTypeName" => validated.Sort.Descending ? query.OrderByDescending(x => x.PlantTypeName).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.PlantTypeName).ThenBy(x => x.CreatedAt),
            "plantStatusName" => validated.Sort.Descending ? query.OrderByDescending(x => x.PlantStatusName).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.PlantStatusName).ThenBy(x => x.CreatedAt),
            "updatedAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt) : query.OrderBy(x => x.UpdatedAt ?? x.CreatedAt),
            "isActive" => validated.Sort.Descending ? query.OrderByDescending(x => x.IsActive).ThenByDescending(x => x.CreatedAt) : query.OrderBy(x => x.IsActive).ThenBy(x => x.CreatedAt),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt)
        };

        var pageItems = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToListAsync(cancellationToken);

        var plantIds = pageItems.Select(x => x.Id).ToArray();
        var thresholdsCounts = plantIds.Length == 0
            ? new Dictionary<Guid, int>()
            : await _dbContext.PlantThresholds.AsNoTracking()
                .Where(x => !x.IsDeleted && plantIds.Contains(x.PlantId))
                .GroupBy(x => x.PlantId)
                .Select(x => new { PlantId = x.Key, Count = x.Count() })
                .ToDictionaryAsync(x => x.PlantId, x => x.Count, cancellationToken);

        var eventsCounts = plantIds.Length == 0
            ? new Dictionary<Guid, int>()
            : await _dbContext.PlantEvents.AsNoTracking()
                .Where(x => !x.IsDeleted && plantIds.Contains(x.PlantId))
                .GroupBy(x => x.PlantId)
                .Select(x => new { PlantId = x.Key, Count = x.Count() })
                .ToDictionaryAsync(x => x.PlantId, x => x.Count, cancellationToken);

        var items = pageItems
            .Select(x => new PlantListItemDto(
                x.Id,
                x.ClientId,
                x.InstallationId,
                x.Code,
                x.Name,
                x.Description,
                x.PlantTypeId,
                x.PlantStatusId,
                x.IsActive,
                x.InstallationName,
                x.PlantTypeName,
                x.PlantStatusName,
                x.PrimaryPhotoUrl,
                thresholdsCounts.GetValueOrDefault(x.Id),
                eventsCounts.GetValueOrDefault(x.Id),
                x.CreatedAt,
                x.UpdatedAt))
            .ToArray();

        return SearchRequestValidation.ToPagedResult(items, validated.Pagination, totalCount);
    }
}
