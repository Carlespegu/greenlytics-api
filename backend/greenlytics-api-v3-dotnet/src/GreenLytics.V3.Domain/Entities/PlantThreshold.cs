using GreenLytics.V3.Domain.Common;

namespace GreenLytics.V3.Domain.Entities;

public sealed class PlantThreshold : BaseAuditableEntity
{
    public Guid PlantId { get; set; }
    public Guid ReadingTypeId { get; set; }
    public Guid? UnitTypeId { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? OptimalValue { get; set; }
    public bool IsActive { get; set; } = true;
}
