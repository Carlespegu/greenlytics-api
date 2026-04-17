namespace GreenLytics.V3.Shared.Exceptions;

public sealed class PhotoStorageFailedException : Exception
{
    public PhotoStorageFailedException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
