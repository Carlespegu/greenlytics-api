namespace GreenLytics.V3.Application.Abstractions;

public interface ICurrentUserAccessor : ICurrentUser
{
    string? Username { get; }
}
