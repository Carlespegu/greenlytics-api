namespace GreenLytics.V3.Application.TableMetadata;

public sealed record TableFieldMetadataDto(
    string Key,
    string Label,
    string DataType,
    bool Sortable,
    bool DefaultVisible
);
