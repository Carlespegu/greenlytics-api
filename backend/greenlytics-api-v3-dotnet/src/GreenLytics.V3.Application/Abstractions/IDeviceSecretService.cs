namespace GreenLytics.V3.Application.Abstractions;

public interface IDeviceSecretService
{
    string GenerateSecret();
    string HashSecret(string rawSecret);
    bool VerifySecret(string secretHash, string providedSecret);
}
