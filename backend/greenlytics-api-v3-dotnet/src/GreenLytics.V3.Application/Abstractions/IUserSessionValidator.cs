using System.Security.Claims;
using GreenLytics.V3.Application.Auth;

namespace GreenLytics.V3.Application.Abstractions;

public interface IUserSessionValidator
{
    Task<SessionValidationResult> ValidateAccessTokenAsync(
        string accessToken,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default);
}
