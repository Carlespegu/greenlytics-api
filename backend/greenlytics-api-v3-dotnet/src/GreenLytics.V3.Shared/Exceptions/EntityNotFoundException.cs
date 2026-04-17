namespace GreenLytics.V3.Shared.Exceptions;

public sealed class EntityNotFoundException : Exception
{
    public EntityNotFoundException(string message) : base(message)
    {
    }
}
