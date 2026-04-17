using System.Text;
using System.Text.Json;

namespace GreenLytics.V3.Application.Auth;

public static class JwtTokenReader
{
    public static JwtTokenClaims Read(string jwt)
    {
        var parts = jwt.Split('.');
        if (parts.Length < 2)
        {
            throw new UnauthorizedAccessException("The access token is malformed.");
        }

        var payload = parts[1]
            .Replace('-', '+')
            .Replace('_', '/');

        switch (payload.Length % 4)
        {
            case 2:
                payload += "==";
                break;
            case 3:
                payload += "=";
                break;
        }

        var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        return new JwtTokenClaims(
            TryReadGuid(root, "sub"),
            TryReadString(root, "email"),
            TryReadString(root, "jti"),
            TryReadString(root, "session_id"));
    }

    private static string? TryReadString(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out var value) ? value.GetString() : null;

    private static Guid? TryReadGuid(JsonElement root, string propertyName)
    {
        var text = TryReadString(root, propertyName);
        return Guid.TryParse(text, out var value) ? value : null;
    }
}
