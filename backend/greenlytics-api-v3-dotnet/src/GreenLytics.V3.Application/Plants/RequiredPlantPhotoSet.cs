namespace GreenLytics.V3.Application.Plants;

public sealed record RequiredPlantPhotoSet(
    PlantPhotoPayload Leaf,
    PlantPhotoPayload Trunk,
    PlantPhotoPayload General
);

public sealed record PlantPhotoPayload(
    string FileName,
    string MimeType,
    byte[] Content,
    string? PhotoPart = null
)
{
    public static PlantPhotoPayload Empty() => new(string.Empty, "application/octet-stream", Array.Empty<byte>());
}
