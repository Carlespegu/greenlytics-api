namespace GreenLytics.V3.Shared.Exceptions;

public sealed class UserProvisioningException : Exception
{
    public UserProvisioningException(string message, Exception? innerException = null) : base(message, innerException)
    {
    }
}
