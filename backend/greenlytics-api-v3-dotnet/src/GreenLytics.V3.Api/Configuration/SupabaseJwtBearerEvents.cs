using System.Security.Claims;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Logging;

namespace GreenLytics.V3.Api.Configuration;

public sealed class SupabaseJwtBearerEvents : JwtBearerEvents
{
    private readonly IUserSessionValidator _userSessionValidator;
    private readonly ILogger<SupabaseJwtBearerEvents> _logger;

    public SupabaseJwtBearerEvents(IUserSessionValidator userSessionValidator, ILogger<SupabaseJwtBearerEvents> logger)
    {
        _userSessionValidator = userSessionValidator;
        _logger = logger;
    }

    public override Task MessageReceived(MessageReceivedContext context)
    {
        var authorizationHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(context.Token) && !string.IsNullOrWhiteSpace(authorizationHeader))
        {
            const string bearerPrefix = "Bearer ";
            if (authorizationHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authorizationHeader[bearerPrefix.Length..].Trim();
            }
        }

        _logger.LogInformation(
            "auth.message_received path={Path} has_authorization={HasAuthorization} token_present={TokenPresent} token_length={TokenLength}",
            context.Request.Path,
            !string.IsNullOrWhiteSpace(authorizationHeader),
            !string.IsNullOrWhiteSpace(context.Token),
            context.Token?.Length ?? 0);

        if (!string.IsNullOrWhiteSpace(context.Token))
        {
            context.HttpContext.Items["raw_access_token"] = context.Token;
        }

        return Task.CompletedTask;
    }

    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var rawToken = context.HttpContext.Items.TryGetValue("raw_access_token", out var tokenValue)
            ? tokenValue as string
            : null;

        if (string.IsNullOrWhiteSpace(rawToken) || context.Principal is null)
        {
            context.Fail("The access token is missing.");
            return;
        }

        var validationResult = await _userSessionValidator.ValidateAccessTokenAsync(rawToken, context.Principal, context.HttpContext.RequestAborted);
        if (!validationResult.IsValid || !validationResult.UserId.HasValue)
        {
            context.Fail("The session is invalid or has been revoked.");
            return;
        }

        if (context.Principal.Identity is not ClaimsIdentity identity)
        {
            context.Fail("The JWT identity is invalid.");
            return;
        }

        AddClaimIfMissing(identity, AuthClaimTypes.LocalUserId, validationResult.UserId.Value.ToString());
        AddClaimIfMissing(identity, AuthClaimTypes.Email, validationResult.Email);
        AddClaimIfMissing(identity, AuthClaimTypes.RoleId, validationResult.RoleId?.ToString());
        AddClaimIfMissing(identity, AuthClaimTypes.RoleCode, validationResult.RoleCode);
        AddClaimIfMissing(identity, AuthClaimTypes.ClientId, validationResult.ClientId?.ToString());
        AddClaimIfMissing(identity, AuthClaimTypes.Username, validationResult.Username);
        AddClaimIfMissing(identity, AuthClaimTypes.BackendSessionId, validationResult.SessionId?.ToString());
        AddClaimIfMissing(identity, ClaimTypes.Name, validationResult.Username);
        AddClaimIfMissing(identity, ClaimTypes.Email, validationResult.Email);
        AddClaimIfMissing(identity, ClaimTypes.Role, validationResult.RoleCode);

        _logger.LogInformation(
            "auth.token_validated user_id={UserId} session_id={SessionId} role_code={RoleCode}",
            validationResult.UserId,
            validationResult.SessionId,
            validationResult.RoleCode);
    }

    public override Task AuthenticationFailed(AuthenticationFailedContext context)
    {
        _logger.LogWarning(
            context.Exception,
            "auth.authentication_failed path={Path} message={Message}",
            context.Request.Path,
            context.Exception.Message);

        return Task.CompletedTask;
    }

    private static void AddClaimIfMissing(ClaimsIdentity identity, string claimType, string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || identity.HasClaim(claimType, value))
        {
            return;
        }

        identity.AddClaim(new Claim(claimType, value));
    }
}
