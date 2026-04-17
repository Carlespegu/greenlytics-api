namespace GreenLytics.V3.Infrastructure.Authentication;

public sealed class SupabaseAuthenticationOptions
{
    public const string SectionName = "Authentication:Supabase";

    public string Url { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string? ServiceRoleKey { get; set; }
    public string? JwtIssuer { get; set; }
    public string? JwtAudience { get; set; }
    public bool RequireHttpsMetadata { get; set; } = true;

    public string OpenIdConfigurationUrl
        => $"{Url.TrimEnd('/')}/auth/v1/.well-known/openid-configuration";

    public string ResolvedJwtIssuer
        => string.IsNullOrWhiteSpace(JwtIssuer)
            ? $"{Url.TrimEnd('/')}/auth/v1"
            : JwtIssuer.TrimEnd('/');
}

public sealed class RefreshTokenOptions
{
    public const string SectionName = "Authentication:RefreshToken";
    public int ExpirationHours { get; set; } = 8;
}

public sealed class SessionOptions
{
    public const string SectionName = "Authentication:Session";
    public int ExpirationHours { get; set; } = 8;
    public bool InvalidatePreviousSessionOnLogin { get; set; } = true;
}
