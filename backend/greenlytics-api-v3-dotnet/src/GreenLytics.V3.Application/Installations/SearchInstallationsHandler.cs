using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Installations;

public sealed class SearchInstallationsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly InstallationManagementValidationService _validationService;

    public SearchInstallationsHandler(
        IAppDbContext dbContext,
        InstallationManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<InstallationListItemDto>> HandleAsync(InstallationsSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query =
            from installation in _dbContext.Installations.AsNoTracking()
            where !installation.IsDeleted
            select new
            {
                installation.Id,
                installation.ClientId,
                installation.Code,
                installation.Name,
                installation.Description,
                installation.Location,
                installation.IsActive,
                installation.CreatedAt,
                installation.UpdatedAt,
                PlantsCount = _dbContext.Plants.Count(plant => !plant.IsDeleted && plant.InstallationId == installation.Id),
                DevicesCount = _dbContext.Devices.Count(device => !device.IsDeleted && device.InstallationId == installation.Id)
            };

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Code))
        {
            var code = validated.Code.ToLowerInvariant();
            query = query.Where(x => x.Code.ToLower().Contains(code));
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            var name = validated.Name.ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(validated.Location))
        {
            var location = validated.Location.ToLowerInvariant();
            query = query.Where(x => x.Location != null && x.Location.ToLower().Contains(location));
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

        query = validated.Sort.Field switch
        {
            "code" => validated.Sort.Descending ? query.OrderByDescending(x => x.Code) : query.OrderBy(x => x.Code),
            "name" => validated.Sort.Descending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name),
            "location" => validated.Sort.Descending ? query.OrderByDescending(x => x.Location) : query.OrderBy(x => x.Location),
            "updatedAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.UpdatedAt) : query.OrderBy(x => x.UpdatedAt),
            "isActive" => validated.Sort.Descending ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
            "plantsCount" => validated.Sort.Descending ? query.OrderByDescending(x => x.PlantsCount) : query.OrderBy(x => x.PlantsCount),
            "devicesCount" => validated.Sort.Descending ? query.OrderByDescending(x => x.DevicesCount) : query.OrderBy(x => x.DevicesCount),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var pageItems = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToArrayAsync(cancellationToken);

        var items = pageItems
            .Select(x => new InstallationListItemDto(
                x.Id,
                x.ClientId,
                x.Code,
                x.Name,
                x.Description,
                x.Location,
                x.IsActive,
                x.PlantsCount,
                x.DevicesCount,
                x.CreatedAt,
                x.UpdatedAt))
            .ToArray();

        return SearchRequestValidation.ToPagedResult(items, validated.Pagination, totalItems);
    }
}
