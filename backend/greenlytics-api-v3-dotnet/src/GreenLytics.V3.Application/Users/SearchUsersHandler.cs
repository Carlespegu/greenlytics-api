using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Users;

public sealed class SearchUsersHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly UserManagementValidationService _validationService;

    public SearchUsersHandler(
        IAppDbContext dbContext,
        UserManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<UserDto>> HandleAsync(UsersSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query = _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Where(x => !x.IsDeleted);

        if (validated.ClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.ClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Email))
        {
            var emailFilter = validated.Email.ToLowerInvariant();
            query = query.Where(x => x.Email.ToLower().Contains(emailFilter));
        }

        if (!string.IsNullOrWhiteSpace(validated.Code))
        {
            var codeFilter = validated.Code.ToLowerInvariant();
            query = query.Where(x => x.Code != null && x.Code.ToLower().Contains(codeFilter));
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            var nameFilter = validated.Name.ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(nameFilter));
        }

        if (validated.RoleId.HasValue)
        {
            query = query.Where(x => x.RoleId == validated.RoleId.Value);
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
            "email" => validated.Sort.Descending ? query.OrderByDescending(x => x.Email) : query.OrderBy(x => x.Email),
            "code" => validated.Sort.Descending ? query.OrderByDescending(x => x.Code) : query.OrderBy(x => x.Code),
            "name" => validated.Sort.Descending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToArrayAsync(cancellationToken);

        return Common.SearchRequestValidation.ToPagedResult(items.Select(x => x.ToDto()).ToArray(), validated.Pagination, totalItems);
    }
}
