namespace GreenLytics.V3.Domain.Entities;

public sealed class Reading
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid InstallationId { get; set; }
    public Guid DeviceId { get; set; }
    public DateTime ReadAt { get; set; }
    public string? Source { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public Device? Device { get; set; }
    public ICollection<ReadingValue> Values { get; set; } = new List<ReadingValue>();
}
