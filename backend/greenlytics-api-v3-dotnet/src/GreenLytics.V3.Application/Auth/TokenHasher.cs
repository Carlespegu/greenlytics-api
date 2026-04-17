using System.Security.Cryptography;
using System.Text;

namespace GreenLytics.V3.Application.Auth;

public static class TokenHasher
{
    public static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
