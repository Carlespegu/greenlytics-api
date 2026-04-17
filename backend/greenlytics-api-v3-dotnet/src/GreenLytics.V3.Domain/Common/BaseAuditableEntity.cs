namespace GreenLytics.V3.Domain.Common;

public interface IAuditableEntity
{
    Guid Id { get; set; }
    DateTime CreatedAt { get; set; }
    Guid? CreatedByUserId { get; set; }
    DateTime? UpdatedAt { get; set; }
    Guid? UpdatedByUserId { get; set; }
    Guid? DeletedByUserId { get; set; }
    DateTime? DeletedAt { get; set; }
    bool IsDeleted { get; set; }
}

public abstract class BaseAuditableEntity : IAuditableEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public bool IsDeleted { get; set; }
}
