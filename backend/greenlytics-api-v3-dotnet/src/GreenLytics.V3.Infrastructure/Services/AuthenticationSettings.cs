using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Infrastructure.Authentication;
using Microsoft.Extensions.Options;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class AuthenticationSettings : IAuthenticationSettings
{
    private readonly RefreshTokenOptions _refreshTokenOptions;
    private readonly SessionOptions _sessionOptions;

    public AuthenticationSettings(IOptions<RefreshTokenOptions> refreshTokenOptions, IOptions<SessionOptions> sessionOptions)
    {
        _refreshTokenOptions = refreshTokenOptions.Value;
        _sessionOptions = sessionOptions.Value;
    }

    public TimeSpan RefreshTokenLifetime => TimeSpan.FromHours(_refreshTokenOptions.ExpirationHours);
    public TimeSpan SessionLifetime => TimeSpan.FromHours(_sessionOptions.ExpirationHours);
    public bool InvalidatePreviousSessionOnLogin => _sessionOptions.InvalidatePreviousSessionOnLogin;
}
