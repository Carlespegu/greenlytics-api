using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly LoginHandler _loginHandler;
    private readonly ForgotPasswordHandler _forgotPasswordHandler;
    private readonly ResetPasswordHandler _resetPasswordHandler;
    private readonly RefreshTokenHandler _refreshTokenHandler;
    private readonly LogoutHandler _logoutHandler;
    private readonly GetCurrentUserHandler _getCurrentUserHandler;
    private readonly ICurrentUser _currentUser;

    public AuthController(
        LoginHandler loginHandler,
        ForgotPasswordHandler forgotPasswordHandler,
        ResetPasswordHandler resetPasswordHandler,
        RefreshTokenHandler refreshTokenHandler,
        LogoutHandler logoutHandler,
        GetCurrentUserHandler getCurrentUserHandler,
        ICurrentUser currentUser)
    {
        _loginHandler = loginHandler;
        _forgotPasswordHandler = forgotPasswordHandler;
        _resetPasswordHandler = resetPasswordHandler;
        _refreshTokenHandler = refreshTokenHandler;
        _logoutHandler = logoutHandler;
        _getCurrentUserHandler = getCurrentUserHandler;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Inicia el flux de recuperacio de password enviant un enllac per correu.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiEnvelope<object>>> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _forgotPasswordHandler.HandleAsync(new ForgotPasswordCommand(request.Email, request.RedirectUrl), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null, "If the account exists, a recovery link has been sent."));
        }
        catch (RequestValidationException validationException)
        {
            return StatusCode(
                validationException.StatusCode,
                new ApiEnvelope<object>(false, null, validationException.Message, validationException.ErrorCode, validationException.Errors));
        }
    }

    /// <summary>
    /// Defineix una nova password a partir d un token de recuperacio valid.
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiEnvelope<object>>> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _resetPasswordHandler.HandleAsync(new ResetPasswordCommand(request.AccessToken, request.NewPassword), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null, "Password updated successfully."));
        }
        catch (RequestValidationException validationException)
        {
            return StatusCode(
                validationException.StatusCode,
                new ApiEnvelope<object>(false, null, validationException.Message, validationException.ErrorCode, validationException.Errors));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiEnvelope<object>(false, null, ex.Message));
        }
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

public sealed class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string? RedirectUrl { get; set; }
}

public sealed class ResetPasswordRequest
{
    public string AccessToken { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
