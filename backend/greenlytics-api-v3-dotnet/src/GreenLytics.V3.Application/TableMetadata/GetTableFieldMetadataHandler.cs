using GreenLytics.V3.Shared.Exceptions;

namespace GreenLytics.V3.Application.TableMetadata;

public sealed class GetTableFieldMetadataHandler
{
    private static readonly IReadOnlyDictionary<string, IReadOnlyList<TableFieldMetadataDto>> Definitions =
        new Dictionary<string, IReadOnlyList<TableFieldMetadataDto>>(StringComparer.OrdinalIgnoreCase)
        {
            ["plants"] = BuildDefinition(
                new("code", "Code", "text", true, true),
                new("name", "Name", "text", true, true),
                new("description", "Description", "text", false, false),
                new("plantTypeName", "Plant Type", "text", false, true),
                new("plantStatusName", "Plant Status", "text", false, true),
                new("installationName", "Installation", "relation", false, true),
                new("primaryPhotoUrl", "Primary Photo", "image", false, false),
                new("thresholdsCount", "Thresholds", "number", false, false),
                new("eventsCount", "Events", "number", false, false),
                new("isActive", "Active", "boolean", false, true),
                new("createdAt", "Created At", "datetime", false, true)),
            ["installations"] = BuildDefinition(
                new("code", "Code", "text", true, true),
                new("name", "Name", "text", true, true),
                new("location", "Location", "text", false, false),
                new("isActive", "Active", "boolean", true, true)),
            ["devices"] = BuildDefinition(
                new("code", "Code", "text", true, true),
                new("name", "Name", "text", true, true),
                new("serialNumber", "Serial Number", "text", true, true),
                new("firmwareVersion", "Firmware Version", "text", false, true),
                new("deviceTypeName", "Device Type", "text", false, true),
                new("installationName", "Installation", "relation", false, true),
                new("lastSeenAt", "Last Seen", "datetime", false, false),
                new("status", "Status", "status", false, true),
                new("isActive", "Active", "boolean", true, false)),
            ["alerts"] = BuildDefinition(
                new("name", "Name", "text", true, true),
                new("channel", "Channel", "text", false, true),
                new("conditionType", "Condition Type", "text", false, true),
                new("recipientEmail", "Recipient", "text", false, false),
                new("isActive", "Active", "boolean", true, true)),
            ["readings"] = BuildDefinition(
                new("readAt", "Read At", "datetime", true, true),
                new("deviceCode", "Device", "text", false, true),
                new("readingTypeCode", "Reading Type", "text", false, true),
                new("value", "Value", "text", true, true),
                new("plantCode", "Plant", "text", false, false),
                new("installationName", "Installation", "relation", false, false)),
        };

    public Task<IReadOnlyList<TableFieldMetadataDto>> HandleAsync(string tableName, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        if (!Definitions.TryGetValue((tableName ?? string.Empty).Trim(), out var definition))
        {
            throw RequestValidationException.BadRequest(
                "The requested table metadata definition does not exist.",
                RequestValidationException.Field("tableName", "unsupported", "The requested table metadata definition does not exist."));
        }

        return Task.FromResult(definition);
    }

    private static IReadOnlyList<TableFieldMetadataDto> BuildDefinition(params TableFieldMetadataDto[] fields)
        => fields;
}
