using System.Net.Mail;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GreenLytics.V3.Application.Auth;

public sealed class ForgotPasswordHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ISupabaseAuthGateway _supabaseAuthGateway;
    private readonly PasswordRecoveryOptions _options;

    public ForgotPasswordHandler(
        IAppDbContext dbContext,
        ISupabaseAuthGateway supabaseAuthGateway,
        IOptions<PasswordRecoveryOptions> options)
    {
        _dbContext = dbContext;
        _supabaseAuthGateway = supabaseAuthGateway;
        _options = options.Value;
    }

    public async Task HandleAsync(ForgotPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(command.Email);
        var redirectUrl = ResolveRedirectUrl(command.RedirectUrl);

        var userExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(x => !x.IsDeleted && x.IsActive && x.Email == email, cancellationToken);

        if (!userExists)
        {
            return;
        }

        await _supabaseAuthGateway.SendPasswordRecoveryEmailAsync(email, redirectUrl, cancellationToken);
    }

    private string ResolveRedirectUrl(string? requestedRedirectUrl)
    {
        var candidate = string.IsNullOrWhiteSpace(requestedRedirectUrl)
            ? _options.ResolveDefaultRedirectUrl()
            : requestedRedirectUrl.Trim();

        if (string.IsNullOrWhiteSpace(candidate))
        {
            throw RequestValidationException.BadRequest(
                "A password recovery redirect URL is required.",
                RequestValidationException.Field("redirectUrl", "required", "A password recovery redirect URL is required."));
        }

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw RequestValidationException.BadRequest(
                "The password recovery redirect URL is invalid.",
                RequestValidationException.Field("redirectUrl", "invalid_format", "The password recovery redirect URL is invalid."));
        }

        return uri.ToString();
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Email is required.",
                RequestValidationException.Field("email", "required", "Email is required."));
        }

        try
        {
            _ = new MailAddress(normalized);
        }
        catch (FormatException)
        {
            throw RequestValidationException.BadRequest(
                "Email format is invalid.",
                RequestValidationException.Field("email", "invalid_format", "Email format is invalid."));
        }

        return normalized;
    }
}
