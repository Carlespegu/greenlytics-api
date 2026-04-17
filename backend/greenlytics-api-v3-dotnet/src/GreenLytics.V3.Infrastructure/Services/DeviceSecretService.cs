using System.Security.Cryptography;
using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class DeviceSecretService : IDeviceSecretService
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;
    private const string Version = "v1";

    public string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }

    public string HashSecret(string rawSecret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawSecret);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            rawSecret,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return $"{Version}.{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool VerifySecret(string secretHash, string providedSecret)
    {
        if (string.IsNullOrWhiteSpace(secretHash) || string.IsNullOrWhiteSpace(providedSecret))
        {
            return false;
        }

        var parts = secretHash.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 4 || !string.Equals(parts[0], Version, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expectedHash = Convert.FromBase64String(parts[3]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                providedSecret,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
