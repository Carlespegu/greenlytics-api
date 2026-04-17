namespace GreenLytics.V3.Domain.Entities;

public sealed class InstallationDevice
{
    public Guid Id { get; set; }
    public Guid InstallationId { get; set; }
    public Guid DeviceId { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? UnassignedAt { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}
