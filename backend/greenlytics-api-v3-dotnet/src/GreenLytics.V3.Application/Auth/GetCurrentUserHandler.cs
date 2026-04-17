using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Auth;

public sealed class GetCurrentUserHandler
{
    private readonly ICurrentUser _currentUser;
    private readonly IAppDbContext _dbContext;

    public GetCurrentUserHandler(ICurrentUser currentUser, IAppDbContext dbContext)
    {
        _currentUser = currentUser;
        _dbContext = dbContext;
    }

    public async Task<CurrentUserDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("The user is not authenticated.");
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .SingleOrDefaultAsync(
                x => x.Id == _currentUser.UserId.Value && !x.IsDeleted,
                cancellationToken);

        if (user?.Role is null)
        {
            throw new UnauthorizedAccessException("The authenticated user does not exist locally.");
        }

        return user.ToCurrentUserDto();
    }
}
