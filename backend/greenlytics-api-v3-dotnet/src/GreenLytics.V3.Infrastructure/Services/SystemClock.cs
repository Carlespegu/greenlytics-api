using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
