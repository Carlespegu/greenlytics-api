using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class PlantEvent : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public Guid PlantId { get; set; }
    public Guid EventTypeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime EventDate { get; set; }
    public bool IsActive { get; set; } = true;
}
