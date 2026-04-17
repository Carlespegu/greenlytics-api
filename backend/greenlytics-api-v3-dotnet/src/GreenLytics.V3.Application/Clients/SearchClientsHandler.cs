using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Clients;

public sealed class SearchClientsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ClientManagementValidationService _validationService;

    public SearchClientsHandler(
        IAppDbContext dbContext,
        ClientManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<ClientDto>> HandleAsync(ClientsSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query = _dbContext.Clients
            .AsNoTracking()
            .Where(x => !x.IsDeleted);

        if (validated.ForcedClientId.HasValue)
        {
            query = query.Where(x => x.Id == validated.ForcedClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Code))
        {
            query = query.Where(x => x.Code.Contains(validated.Code));
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            query = query.Where(x => x.Name.Contains(validated.Name));
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
