namespace GreenLytics.V3.Application.Abstractions;

public interface IAuthenticationSettings
{
    TimeSpan RefreshTokenLifetime { get; }
    TimeSpan SessionLifetime { get; }
    bool InvalidatePreviousSessionOnLogin { get; }
}
