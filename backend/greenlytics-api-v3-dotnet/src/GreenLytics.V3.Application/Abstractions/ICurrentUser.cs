namespace GreenLytics.V3.Application.Abstractions;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    Guid? RoleId { get; }
    string? RoleCode { get; }
    Guid? ClientId { get; }
    bool IsAuthenticated { get; }
}
