namespace GreenLytics.V3.Application.Clients;

public sealed record ClientDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    Guid? CreatedByUserId,
    DateTime? UpdatedAt,
    Guid? UpdatedByUserId
);
