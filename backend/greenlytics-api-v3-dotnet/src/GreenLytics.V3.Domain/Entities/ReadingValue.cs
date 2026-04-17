namespace GreenLytics.V3.Domain.Entities;

public sealed class ReadingValue
{
    public Guid Id { get; set; }
    public Guid ReadingId { get; set; }
    public Guid ReadingTypeId { get; set; }
    public Guid? UnitTypeId { get; set; }
    public decimal Value { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public Reading? Reading { get; set; }
    public TypeCatalog? ReadingType { get; set; }
    public TypeCatalog? UnitType { get; set; }
}
