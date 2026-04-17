namespace GreenLytics.V3.Application.Auth;

public sealed record LogoutCommand(Guid UserId, Guid SessionId);
