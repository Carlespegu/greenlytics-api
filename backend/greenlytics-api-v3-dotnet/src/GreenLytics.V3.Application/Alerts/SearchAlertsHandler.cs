using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Alerts;

public sealed class SearchAlertsHandler
{
    private readonly AlertManagementValidationService _validationService;
    private readonly GetAlertDetailHandler _detailHandler;

    public SearchAlertsHandler(AlertManagementValidationService validationService, GetAlertDetailHandler detailHandler)
    {
        _validationService = validationService;
        _detailHandler = detailHandler;
    }

    public async Task<PagedResult<AlertDto>> HandleAsync(AlertsSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query = _detailHandler.BuildQuery();

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            query = query.Where(x => x.Name.Contains(validated.Name));
        }

        if (validated.InstallationId.HasValue)
        {
            query = query.Where(x => x.InstallationId == validated.InstallationId.Value);
        }

        if (validated.PlantId.HasValue)
        {
            query = query.Where(x => x.PlantId == validated.PlantId.Value);
        }

        if (validated.ReadingTypeId.HasValue)
        {
            query = query.Where(x => x.ReadingTypeId == validated.ReadingTypeId.Value);
        }

        if (validated.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == validated.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Channel))
        {
            query = query.Where(x => x.Channel.Contains(validated.Channel));
        }

        if (!string.IsNullOrWhiteSpace(validated.ConditionType))
        {
            query = query.Where(x => x.ConditionType.Contains(validated.ConditionType));
        }

        if (!string.IsNullOrWhiteSpace(validated.RecipientEmail))
        {
            query = query.Where(x => x.RecipientEmail != null && x.RecipientEmail.Contains(validated.RecipientEmail));
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
            "name" => validated.Sort.Descending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name),
            "updatedAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.UpdatedAt) : query.OrderBy(x => x.UpdatedAt),
            "isActive" => validated.Sort.Descending ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
            "channel" => validated.Sort.Descending ? query.OrderByDescending(x => x.Channel) : query.OrderBy(x => x.Channel),
            "conditionType" => validated.Sort.Descending ? query.OrderByDescending(x => x.ConditionType) : query.OrderBy(x => x.ConditionType),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToArrayAsync(cancellationToken);

        return SearchRequestValidation.ToPagedResult(items.Select(x => x.ToDto()).ToArray(), validated.Pagination, totalItems);
    }
}

