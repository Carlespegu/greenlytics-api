namespace GreenLytics.V3.Shared.Contracts;

public sealed record AuditStamp(
    DateTime? CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
