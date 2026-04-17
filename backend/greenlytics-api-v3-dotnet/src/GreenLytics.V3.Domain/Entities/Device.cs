using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class Device : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public Guid InstallationId { get; set; }
    public Guid DeviceTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? FirmwareVersion { get; set; }
    public string? DeviceSecretHash { get; set; }
    public DateTime? SecretRotatedAt { get; set; }
    public DateTime? LastAuthenticatedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public bool IsActive { get; set; } = true;

    public Installation? Installation { get; set; }
}
