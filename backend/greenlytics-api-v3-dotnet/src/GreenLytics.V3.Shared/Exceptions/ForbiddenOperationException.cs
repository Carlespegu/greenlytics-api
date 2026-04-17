namespace GreenLytics.V3.Shared.Exceptions;

public sealed class ForbiddenOperationException : Exception
{
    public ForbiddenOperationException(string message)
        : base(message)
    {
    }
}
