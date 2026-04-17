using System.Security.Claims;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class UserSessionValidator : IUserSessionValidator
{
    private readonly GreenLyticsDbContext _dbContext;
    private readonly IClock _clock;

    public UserSessionValidator(GreenLyticsDbContext dbContext, IClock clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task<SessionValidationResult> ValidateAccessTokenAsync(
        string accessToken,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var hash = TokenHasher.Hash(accessToken);
        var now = _clock.UtcNow;

        var session = await _dbContext.UserSessions
            .AsNoTracking()
            .Include(x => x.User)
            .ThenInclude(x => x!.Role)
            .SingleOrDefaultAsync(
                x => !x.IsDeleted &&
                     x.IsActive &&
                     x.RevokedOn == null &&
                     x.AccessTokenHash == hash,
                cancellationToken);

        if (session?.User?.Role is null)
        {
            return Invalid();
        }

        if (session.ExpiresOn <= now || !session.User.IsActive || session.User.IsDeleted || !session.User.Role.IsActive || session.User.Role.IsDeleted)
        {
            return Invalid();
        }

        var tokenSupabaseUserId = principal.FindFirstValue(AuthClaimTypes.SupabaseUserId);
        if (!string.IsNullOrWhiteSpace(session.User.ExternalAuthId) &&
            Guid.TryParse(tokenSupabaseUserId, out var tokenUserId) &&
            !string.Equals(session.User.ExternalAuthId, tokenUserId.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            return Invalid();
        }

        var tokenJti = principal.FindFirstValue(AuthClaimTypes.JwtId);
        if (!string.IsNullOrWhiteSpace(session.AccessTokenJti) &&
            !string.IsNullOrWhiteSpace(tokenJti) &&
            !string.Equals(session.AccessTokenJti, tokenJti, StringComparison.Ordinal))
        {
            return Invalid();
        }

        return new SessionValidationResult(
            true,
            session.SessionId,
            session.User.Id,
            session.User.RoleId,
            session.User.Role.Code,
            session.User.ClientId,
            session.User.Email,
            session.User.Code ?? session.User.Name);
    }

    private static SessionValidationResult Invalid()
        => new(false, null, null, null, null, null, null, null);
}
