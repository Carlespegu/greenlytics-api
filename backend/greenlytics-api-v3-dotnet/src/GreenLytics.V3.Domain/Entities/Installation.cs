using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class Installation : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Device> Devices { get; set; } = new List<Device>();
    public ICollection<Plant> Plants { get; set; } = new List<Plant>();
}
