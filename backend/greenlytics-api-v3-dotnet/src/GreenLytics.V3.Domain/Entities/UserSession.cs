using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class UserSession : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid SessionId { get; set; }
    public string? AccessTokenJti { get; set; }
    public string AccessTokenHash { get; set; } = string.Empty;
    public string RefreshTokenHash { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresOn { get; set; }
    public DateTime ExpiresOn { get; set; }
    public DateTime? RevokedOn { get; set; }
    public string? RevokedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public User? User { get; set; }
}
