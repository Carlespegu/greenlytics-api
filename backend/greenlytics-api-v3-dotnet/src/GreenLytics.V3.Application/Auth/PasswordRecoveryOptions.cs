namespace GreenLytics.V3.Application.Auth;

public sealed class PasswordRecoveryOptions
{
    public const string SectionName = "Authentication:PasswordRecovery";

    public string? FrontendBaseUrl { get; set; }
    public string ResetPath { get; set; } = "/reset-password";

    public string? ResolveDefaultRedirectUrl()
    {
        if (string.IsNullOrWhiteSpace(FrontendBaseUrl))
        {
            return null;
        }

        var baseUrl = FrontendBaseUrl.Trim().TrimEnd('/');
        var path = string.IsNullOrWhiteSpace(ResetPath) ? "/reset-password" : ResetPath.Trim();
        if (!path.StartsWith('/'))
        {
            path = "/" + path;
        }

        return $"{baseUrl}{path}";
    }
}
