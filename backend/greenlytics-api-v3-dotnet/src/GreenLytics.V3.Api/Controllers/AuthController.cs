using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly LoginHandler _loginHandler;
    private readonly RefreshTokenHandler _refreshTokenHandler;
    private readonly LogoutHandler _logoutHandler;
    private readonly GetCurrentUserHandler _getCurrentUserHandler;
    private readonly ICurrentUser _currentUser;

    public AuthController(
        LoginHandler loginHandler,
        RefreshTokenHandler refreshTokenHandler,
        LogoutHandler logoutHandler,
        GetCurrentUserHandler getCurrentUserHandler,
        ICurrentUser currentUser)
    {
        _loginHandler = loginHandler;
        _refreshTokenHandler = refreshTokenHandler;
        _logoutHandler = logoutHandler;
        _getCurrentUserHandler = getCurrentUserHandler;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Inicia sessio i retorna els tokens d autenticacio.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiEnvelope<LoginResult>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _loginHandler.HandleAsync(
                new LoginCommand(request.Email, request.Password, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString()),
                cancellationToken);

            return Ok(new ApiEnvelope<LoginResult>(true, result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ApiEnvelope<object>(false, null, ex.Message));
        }
    }

    /// <summary>
    /// Renova la sessio amb un refresh token valid.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiEnvelope<LoginResult>>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _refreshTokenHandler.HandleAsync(
                new RefreshTokenCommand(request.RefreshToken, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString()),
                cancellationToken);

            return Ok(new ApiEnvelope<LoginResult>(true, result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, ex.Message));
        }
    }

    /// <summary>
    /// Tanca la sessio activa del backend.
    /// </summary>
    [HttpPost("logout")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    public async Task<ActionResult<ApiEnvelope<object>>> Logout(CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, "The user is not authenticated."));
        }

        var sessionIdClaim = User.FindFirst(AuthClaimTypes.BackendSessionId)?.Value;
        if (!Guid.TryParse(sessionIdClaim, out var sessionId))
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, "The backend session is not available."));
        }

        await _logoutHandler.HandleAsync(new LogoutCommand(_currentUser.UserId.Value, sessionId), cancellationToken);
        return Ok(new ApiEnvelope<object>(true, null, "Session closed."));
    }

    /// <summary>
    /// Retorna les dades de l usuari autenticat.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    public async Task<ActionResult<ApiEnvelope<CurrentUserDto>>> Me(CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getCurrentUserHandler.HandleAsync(cancellationToken);
            return Ok(new ApiEnvelope<CurrentUserDto>(true, result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, ex.Message));
        }
    }
}

public sealed class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
