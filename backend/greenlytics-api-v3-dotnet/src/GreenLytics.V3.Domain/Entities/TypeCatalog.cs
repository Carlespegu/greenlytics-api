using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class TypeCatalog : BaseAuditableEntity
{
    public string Category { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
