using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Auth;

public sealed class RefreshTokenHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly IAuthenticationSettings _authenticationSettings;
    private readonly IClock _clock;

    public RefreshTokenHandler(
        IAppDbContext dbContext,
        ISupabaseAuthGateway supabaseAuthGateway,
        IAuthenticationSettings authenticationSettings,
        IClock clock)
    {
        _dbContext = dbContext;
        _supabaseAuthGateway = supabaseAuthGateway;
        _authenticationSettings = authenticationSettings;
        _clock = clock;
    }

    public async Task<LoginResult> HandleAsync(RefreshTokenCommand command, CancellationToken cancellationToken = default)
    {
        var now = _clock.UtcNow;
        var refreshTokenHash = TokenHasher.Hash(command.RefreshToken);

        var session = await _dbContext.UserSessions
            .Include(x => x.User)
            .ThenInclude(x => x!.Role)
            .SingleOrDefaultAsync(
                x => !x.IsDeleted &&
                     x.IsActive &&
                     x.RevokedOn == null &&
                     x.RefreshTokenHash == refreshTokenHash,
                cancellationToken);

        if (session?.User is null)
        {
            throw new UnauthorizedAccessException("The refresh token is invalid.");
        }

        if (session.RefreshTokenExpiresOn <= now || session.ExpiresOn <= now || !session.User.IsActive || session.User.IsDeleted)
        {
            await RevokeSessionAsync(session, session.User.Id.ToString(), session.User.Id, now, cancellationToken);
            throw new UnauthorizedAccessException("The refresh token has expired.");
        }

        if (session.User.Role is null || !session.User.Role.IsActive || session.User.Role.IsDeleted)
        {
            throw new UnauthorizedAccessException("The user role is invalid.");
        }

        var tokens = await _supabaseAuthGateway.RefreshAsync(command.RefreshToken, cancellationToken);

        if (!string.IsNullOrWhiteSpace(session.User.ExternalAuthId)
            && !string.Equals(session.User.ExternalAuthId, tokens.SupabaseUserId.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("The refresh token does not belong to the current user.");
        }

        session.User.ExternalAuthId ??= tokens.SupabaseUserId.ToString();

        var accessTokenClaims = JwtTokenReader.Read(tokens.AccessToken);
        var actor = session.User.Id.ToString();
        var actorUserId = session.User.Id;

        session.AccessTokenHash = TokenHasher.Hash(tokens.AccessToken);
        session.AccessTokenJti = accessTokenClaims.JwtId;
        session.RefreshTokenHash = TokenHasher.Hash(tokens.RefreshToken);
        session.RefreshTokenExpiresOn = now.Add(_authenticationSettings.RefreshTokenLifetime);
        session.ExpiresOn = now.Add(_authenticationSettings.SessionLifetime);
        session.IpAddress = command.IpAddress;
        session.UserAgent = command.UserAgent;
        session.UpdatedAt = now;
        session.UpdatedByUserId = actorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresIn,
            tokens.TokenType,
            session.User.ToCurrentUserDto());
    }

    private async Task RevokeSessionAsync(Domain.Entities.UserSession session, string actor, Guid actorUserId, DateTime now, CancellationToken cancellationToken)
    {
        session.IsActive = false;
        session.RevokedOn = now;
        session.RevokedBy = actor;
        session.UpdatedAt = now;
        session.UpdatedByUserId = actorUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
