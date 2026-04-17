namespace GreenLytics.V3.Application.Auth;

public static class RoleCodes
{
    public const string Admin = "ADMIN";
    public const string Manager = "MANAGER";
    public const string Viewer = "VIEWER";

    public static readonly IReadOnlyCollection<string> All = new[]
    {
        Admin,
        Manager,
        Viewer,
    };
}
