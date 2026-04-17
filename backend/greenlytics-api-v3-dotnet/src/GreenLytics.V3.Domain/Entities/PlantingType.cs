namespace GreenLytics.V3.Domain.Entities;

public sealed class PlantingType
{
    public Guid Id { get; set; }
    public Guid? ClientId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
}
