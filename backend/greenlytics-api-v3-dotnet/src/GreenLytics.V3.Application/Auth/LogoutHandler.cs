using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Auth;

public sealed class LogoutHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;

    public LogoutHandler(IAppDbContext dbContext, IClock clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task HandleAsync(LogoutCommand command, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.UserSessions.SingleOrDefaultAsync(
            x => x.UserId == command.UserId &&
                 x.SessionId == command.SessionId &&
                 !x.IsDeleted,
            cancellationToken);

        if (session is null)
        {
            return;
        }

        var now = _clock.UtcNow;
        var actor = command.UserId.ToString();
        var actorUserId = command.UserId;

        session.IsActive = false;
        session.RevokedOn = now;
        session.RevokedBy = actor;
        session.UpdatedAt = now;
        session.UpdatedByUserId = actorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
