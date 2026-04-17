using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class Plant : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public Guid InstallationId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? PlantTypeId { get; set; }
    public Guid? PlantStatusId { get; set; }
    public bool IsActive { get; set; } = true;

    public Installation? Installation { get; set; }
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
    public ICollection<PlantThreshold> Thresholds { get; set; } = new List<PlantThreshold>();
    public ICollection<PlantEvent> Events { get; set; } = new List<PlantEvent>();
}
