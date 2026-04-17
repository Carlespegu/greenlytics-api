using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Application.Alerts;

public sealed record CreateAlertCommand(
    Guid? ClientId,
    Guid? InstallationId,
    Guid? PlantId,
    Guid ReadingTypeId,
    string Name,
    string? Description,
    string Channel,
    string? RecipientEmail,
    string ConditionType,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? ExactNumericValue,
    string? ExactTextValue,
    bool? ExactBooleanValue,
    bool IsActive
);

public sealed record UpdateAlertCommand(
    Guid AlertId,
    Guid? ClientId,
    Guid? InstallationId,
    Guid? PlantId,
    Guid ReadingTypeId,
    string Name,
    string? Description,
    string Channel,
    string? RecipientEmail,
    string ConditionType,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? ExactNumericValue,
    string? ExactTextValue,
    bool? ExactBooleanValue,
    bool IsActive
);

public sealed record AlertsSearchRequest(
    AlertSearchFilters? Filters,
    SearchPagination? Pagination,
    SearchSort? Sort
);

public sealed record AlertSearchFilters(
    string? Name,
    Guid? ClientId,
    Guid? InstallationId,
    Guid? PlantId,
    Guid? ReadingTypeId,
    bool? IsActive,
    string? Channel,
    string? ConditionType,
    string? RecipientEmail,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo
);
