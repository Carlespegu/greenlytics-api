namespace GreenLytics.V3.Application.Auth;

public static class AuthorizationPolicies
{
    public const string Authenticated = "authenticated";
    public const string AdminOnly = "admin-only";
    public const string AdminOrManager = "admin-or-manager";
}
