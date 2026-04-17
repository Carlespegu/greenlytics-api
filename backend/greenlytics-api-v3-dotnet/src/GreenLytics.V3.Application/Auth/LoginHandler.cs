using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Auth;

public sealed class LoginHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly IAuthenticationSettings _authenticationSettings;
    private readonly IClock _clock;

    public LoginHandler(
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

    public async Task<LoginResult> HandleAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        var tokens = await _supabaseAuthGateway.SignInWithPasswordAsync(command.Email, command.Password, cancellationToken);
        var user = await ResolveLocalUserAsync(tokens, cancellationToken);

        if (!user.IsActive || user.IsDeleted)
        {
            throw new UnauthorizedAccessException("The user is inactive.");
        }

        if (user.Role is null || !user.Role.IsActive || user.Role.IsDeleted)
        {
            throw new UnauthorizedAccessException("The user does not have a valid role.");
        }

        var now = _clock.UtcNow;
        var actor = user.Id.ToString();
        var actorUserId = user.Id;

        if (_authenticationSettings.InvalidatePreviousSessionOnLogin)
        {
            await RevokeActiveSessionsAsync(user.Id, actor, actorUserId, now, cancellationToken);
        }
        else
        {
            var hasActiveSession = await _dbContext.UserSessions.AnyAsync(
                x => x.UserId == user.Id && x.IsActive && x.RevokedOn == null && x.ExpiresOn > now && !x.IsDeleted,
                cancellationToken);

            if (hasActiveSession)
            {
                throw new InvalidOperationException("The user already has an active session.");
            }
        }

        var accessTokenClaims = JwtTokenReader.Read(tokens.AccessToken);

        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SessionId = Guid.NewGuid(),
            AccessTokenJti = accessTokenClaims.JwtId,
            AccessTokenHash = TokenHasher.Hash(tokens.AccessToken),
            RefreshTokenHash = TokenHasher.Hash(tokens.RefreshToken),
            RefreshTokenExpiresOn = now.Add(_authenticationSettings.RefreshTokenLifetime),
            ExpiresOn = now.Add(_authenticationSettings.SessionLifetime),
            IsActive = true,
            IpAddress = command.IpAddress,
            UserAgent = command.UserAgent,
            CreatedAt = now,
            CreatedByUserId = actorUserId,
        };

        user.UpdatedAt = now;
        user.UpdatedByUserId = actorUserId;

        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresIn,
            tokens.TokenType,
            user.ToCurrentUserDto());
    }

    private async Task<User> ResolveLocalUserAsync(SupabaseAuthTokens tokens, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .Include(x => x.Role)
            .SingleOrDefaultAsync(x => !x.IsDeleted && x.ExternalAuthId == tokens.SupabaseUserId.ToString(), cancellationToken);

        if (user is null && !string.IsNullOrWhiteSpace(tokens.Email))
        {
            user = await _dbContext.Users
                .Include(x => x.Role)
                .SingleOrDefaultAsync(
                    x => !x.IsDeleted
                         && x.Email == tokens.Email
                         && x.ExternalAuthId == null,
                    cancellationToken);
        }

        if (user is null)
        {
            throw new UnauthorizedAccessException("The authenticated Supabase user is not linked to a local GreenLytics user.");
        }

        if (string.IsNullOrWhiteSpace(user.ExternalAuthId))
        {
            user.ExternalAuthId = tokens.SupabaseUserId.ToString();
        }
        else if (!string.Equals(user.ExternalAuthId, tokens.SupabaseUserId.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("The local user is linked to a different Supabase identity.");
        }

        return user;
    }

    private async Task RevokeActiveSessionsAsync(Guid userId, string actor, Guid actorUserId, DateTime now, CancellationToken cancellationToken)
    {
        var activeSessions = await _dbContext.UserSessions
            .Where(x => x.UserId == userId && x.IsActive && x.RevokedOn == null && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var activeSession in activeSessions)
        {
            activeSession.IsActive = false;
            activeSession.RevokedOn = now;
            activeSession.RevokedBy = actor;
            activeSession.UpdatedAt = now;
            activeSession.UpdatedByUserId = actorUserId;
        }
    }
}
