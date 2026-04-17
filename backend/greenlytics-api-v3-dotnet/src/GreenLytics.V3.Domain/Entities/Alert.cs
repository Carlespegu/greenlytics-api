using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class Alert : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public Guid? InstallationId { get; set; }
    public Guid? PlantId { get; set; }
    public Guid ReadingTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string? RecipientEmail { get; set; }
    public string ConditionType { get; set; } = string.Empty;
    public string ValueType { get; set; } = string.Empty;
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? ExactNumericValue { get; set; }
    public string? ExactTextValue { get; set; }
    public bool? ExactBooleanValue { get; set; }
    public bool IsActive { get; set; } = true;
}
