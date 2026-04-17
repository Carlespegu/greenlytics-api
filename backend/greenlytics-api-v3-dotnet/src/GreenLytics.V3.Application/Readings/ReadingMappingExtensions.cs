namespace GreenLytics.V3.Application.Readings;

internal static class ReadingMappingExtensions
{
    public static ReadingResponse ToResponse(
        this ReadingHeaderRow header,
        IReadOnlyList<ReadingValueDto> values)
        => new(
            header.ReadingId,
            header.ClientId,
            header.DeviceId,
            header.DeviceCode,
            header.DeviceName,
            header.InstallationId,
            header.InstallationCode,
            header.InstallationName,
            header.ReadAt,
            header.Source,
            header.CreatedAt,
            values);
}

internal sealed record ReadingHeaderRow(
    Guid ReadingId,
    Guid ClientId,
    Guid DeviceId,
    string? DeviceCode,
    string? DeviceName,
    Guid? InstallationId,
    string? InstallationCode,
    string? InstallationName,
    DateTime ReadAt,
    string? Source,
    DateTime CreatedAt
);
