namespace GreenLytics.V3.Application.Auth;

public static class AuthClaimTypes
{
    public const string SupabaseUserId = "sub";
    public const string Email = "email";
    public const string RoleId = "role_id";
    public const string RoleCode = "role_code";
    public const string ClientId = "client_id";
    public const string JwtId = "jti";
    public const string LocalUserId = "local_user_id";
    public const string BackendSessionId = "backend_session_id";
    public const string Username = "preferred_username";
}
