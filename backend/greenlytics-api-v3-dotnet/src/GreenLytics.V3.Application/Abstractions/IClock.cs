namespace GreenLytics.V3.Application.Abstractions;

public interface IClock
{
    DateTime UtcNow { get; }
}
