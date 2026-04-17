using GreenLytics.V3.Application.Plants;
using GreenLytics.V3.Shared.Exceptions;
using System.Buffers.Binary;
using System.Security.Cryptography;

namespace GreenLytics.V3.Application.Photos;

public sealed class PhotoRequestValidationService
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    };

    private const int MaxFileSizeBytes = 5 * 1024 * 1024;
    private const int MinFileSizeBytes = 1024;
    private const int MinImageWidth = 256;
    private const int MinImageHeight = 256;

    public Dictionary<string, PlantPhotoPayload> ValidatePhotos(
        IReadOnlyDictionary<string, PlantPhotoPayload> photos,
        bool requireAllPhotos,
        bool requireAtLeastOnePhoto)
    {
        var validated = new Dictionary<string, PlantPhotoPayload>(StringComparer.OrdinalIgnoreCase);
        var hashes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var pair in photos)
        {
            var part = pair.Key;
            var payload = pair.Value;

            if (payload.Content.Length == 0)
            {
                if (requireAllPhotos)
                {
                    throw RequestValidationException.BadRequest(
                        $"The {part} photo is required.",
                        RequestValidationException.Field(part, "required", $"The {part} photo is required."));
                }

                continue;
            }

            ValidateFileShape(part, payload, AllowedMimeTypes, AllowedExtensions);

            var hash = Convert.ToHexString(SHA256.HashData(payload.Content));
            if (!hashes.Add(hash))
            {
                throw RequestValidationException.Unprocessable(
                    "The request contains duplicated image files.",
                    RequestValidationException.Field(part, "duplicate_file", $"The {part} photo is identical to another uploaded file."));
            }

            validated[part] = payload;
        }

        if (requireAtLeastOnePhoto && validated.Count == 0)
        {
            throw RequestValidationException.BadRequest(
                "At least one plant photo is required for analysis.",
                RequestValidationException.Field("photos", "required", "At least one plant photo is required for analysis."));
        }

        return validated;
    }

    public IReadOnlyList<PlantPhotoPayload> ValidatePhotoCollection(
        IReadOnlyList<PlantPhotoPayload> photos,
        int minimumCount,
        int maximumCount,
        IReadOnlySet<string> allowedMimeTypes,
        IReadOnlySet<string> allowedExtensions,
        bool rejectDuplicateContent = true)
    {
        if (photos.Count < minimumCount)
        {
            throw RequestValidationException.BadRequest(
                $"At least {minimumCount} plant photo{(minimumCount == 1 ? string.Empty : "s")} {(minimumCount == 1 ? "is" : "are")} required.",
                RequestValidationException.Field("photos", "required", $"At least {minimumCount} plant photo{(minimumCount == 1 ? string.Empty : "s")} {(minimumCount == 1 ? "is" : "are")} required."));
        }

        if (photos.Count > maximumCount)
        {
            throw RequestValidationException.Unprocessable(
                $"A maximum of {maximumCount} plant photos is allowed.",
                RequestValidationException.Field("photos", "too_many_files", $"A maximum of {maximumCount} plant photos is allowed."));
        }

        var validated = new List<PlantPhotoPayload>(photos.Count);
        var hashes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < photos.Count; index++)
        {
            var payload = photos[index];
            var fieldKey = $"photos[{index}]";

            if (payload.Content.Length == 0)
            {
                throw RequestValidationException.BadRequest(
                    "Empty photo entries are not allowed.",
                    RequestValidationException.Field(fieldKey, "required", "Empty photo entries are not allowed."));
            }

            ValidateFileShape(fieldKey, payload, allowedMimeTypes, allowedExtensions);

            var hash = Convert.ToHexString(SHA256.HashData(payload.Content));
            if (rejectDuplicateContent && !hashes.Add(hash))
            {
                throw RequestValidationException.Unprocessable(
                    "The request contains duplicated image files.",
                    RequestValidationException.Field(fieldKey, "duplicate_file", "This photo is identical to another uploaded file."));
            }

            validated.Add(payload);
        }

        return validated;
    }

    private void ValidateFileShape(
        string photoPart,
        PlantPhotoPayload payload,
        IReadOnlySet<string> allowedMimeTypes,
        IReadOnlySet<string> allowedExtensions)
    {
        if (payload.Content.Length < MinFileSizeBytes)
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo is too small to be processed.",
                RequestValidationException.Field(photoPart, "file_too_small", $"The {photoPart} photo is too small to be processed."));
        }

        if (payload.Content.Length > MaxFileSizeBytes)
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo exceeds the maximum allowed size of 5 MB.",
                RequestValidationException.Field(photoPart, "file_too_large", $"The {photoPart} photo exceeds the maximum allowed size of 5 MB."));
        }

        var extension = Path.GetExtension(payload.FileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(extension) || !allowedExtensions.Contains(extension))
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo has an unsupported file extension.",
                RequestValidationException.Field(photoPart, "invalid_extension", $"The {photoPart} photo has an unsupported file extension."));
        }

        if (string.IsNullOrWhiteSpace(payload.MimeType) || !allowedMimeTypes.Contains(payload.MimeType))
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo has an unsupported MIME type.",
                RequestValidationException.Field(photoPart, "invalid_mime_type", $"The {photoPart} photo has an unsupported MIME type."));
        }

        if (!TryReadImageMetadata(payload.Content, out var format, out var width, out var height))
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo is empty, corrupted or not a supported image.",
                RequestValidationException.Field(photoPart, "invalid_image", $"The {photoPart} photo is empty, corrupted or not a supported image."));
        }

        if (!IsMimeCompatibleWithFormat(payload.MimeType, format))
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo content does not match its MIME type.",
                RequestValidationException.Field(photoPart, "mime_mismatch", $"The {photoPart} photo content does not match its MIME type."));
        }

        if (!IsExtensionCompatibleWithFormat(extension, format))
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo content does not match its file extension.",
                RequestValidationException.Field(photoPart, "extension_mismatch", $"The {photoPart} photo content does not match its file extension."));
        }

        if (width < MinImageWidth || height < MinImageHeight)
        {
            throw RequestValidationException.Unprocessable(
                $"The {photoPart} photo must be at least {MinImageWidth}x{MinImageHeight} pixels.",
                RequestValidationException.Field(photoPart, "image_too_small", $"The {photoPart} photo must be at least {MinImageWidth}x{MinImageHeight} pixels."));
        }
    }

    private static bool IsMimeCompatibleWithFormat(string mimeType, string format)
        => format switch
        {
            "jpeg" => mimeType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase)
                      || mimeType.Equals("image/jpg", StringComparison.OrdinalIgnoreCase),
            "png" => mimeType.Equals("image/png", StringComparison.OrdinalIgnoreCase),
            "webp" => mimeType.Equals("image/webp", StringComparison.OrdinalIgnoreCase),
            _ => false,
        };

    private static bool IsExtensionCompatibleWithFormat(string extension, string format)
        => format switch
        {
            "jpeg" => extension.Equals(".jpg", StringComparison.OrdinalIgnoreCase)
                      || extension.Equals(".jpeg", StringComparison.OrdinalIgnoreCase),
            "png" => extension.Equals(".png", StringComparison.OrdinalIgnoreCase),
            "webp" => extension.Equals(".webp", StringComparison.OrdinalIgnoreCase),
            _ => false,
        };

    private static bool TryReadImageMetadata(byte[] content, out string format, out int width, out int height)
    {
        format = string.Empty;
        width = 0;
        height = 0;

        if (TryReadPng(content, out width, out height))
        {
            format = "png";
            return true;
        }

        if (TryReadJpeg(content, out width, out height))
        {
            format = "jpeg";
            return true;
        }

        if (TryReadWebp(content, out width, out height))
        {
            format = "webp";
            return true;
        }

        return false;
    }

    private static bool TryReadPng(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 24)
        {
            return false;
        }

        ReadOnlySpan<byte> signature = stackalloc byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };
        if (!content.AsSpan(0, 8).SequenceEqual(signature))
        {
            return false;
        }

        width = BinaryPrimitives.ReadInt32BigEndian(content.AsSpan(16, 4));
        height = BinaryPrimitives.ReadInt32BigEndian(content.AsSpan(20, 4));
        return width > 0 && height > 0;
    }

    private static bool TryReadJpeg(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 4 || content[0] != 0xFF || content[1] != 0xD8)
        {
            return false;
        }

        var index = 2;
        while (index + 1 < content.Length)
        {
            while (index < content.Length && content[index] == 0xFF)
            {
                index++;
            }

            if (index >= content.Length)
            {
                return false;
            }

            var marker = content[index++];
            if (marker is 0xD8 or 0xD9)
            {
                continue;
            }

            if (marker is >= 0xD0 and <= 0xD7)
            {
                continue;
            }

            if (index + 1 >= content.Length)
            {
                return false;
            }

            var segmentLength = (content[index] << 8) | content[index + 1];
            if (segmentLength < 2 || index + segmentLength > content.Length)
            {
                return false;
            }

            if (marker is 0xC0 or 0xC1 or 0xC2 or 0xC3 or 0xC5 or 0xC6 or 0xC7 or 0xC9 or 0xCA or 0xCB or 0xCD or 0xCE or 0xCF)
            {
                if (segmentLength < 7)
                {
                    return false;
                }

                height = (content[index + 3] << 8) | content[index + 4];
                width = (content[index + 5] << 8) | content[index + 6];
                return width > 0 && height > 0;
            }

            index += segmentLength;
        }

        return false;
    }

    private static bool TryReadWebp(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 30
            || !content.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            || !content.AsSpan(8, 4).SequenceEqual("WEBP"u8))
        {
            return false;
        }

        var chunkType = System.Text.Encoding.ASCII.GetString(content, 12, 4);
        return chunkType switch
        {
            "VP8X" => TryReadWebpExtended(content, out width, out height),
            "VP8 " => TryReadWebpLossy(content, out width, out height),
            "VP8L" => TryReadWebpLossless(content, out width, out height),
            _ => false,
        };
    }

    private static bool TryReadWebpExtended(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 30)
        {
            return false;
        }

        width = 1 + content[24] + (content[25] << 8) + (content[26] << 16);
        height = 1 + content[27] + (content[28] << 8) + (content[29] << 16);
        return width > 0 && height > 0;
    }

    private static bool TryReadWebpLossy(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 30 || content[23] != 0x9D || content[24] != 0x01 || content[25] != 0x2A)
        {
            return false;
        }

        width = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(26, 2)) & 0x3FFF;
        height = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(28, 2)) & 0x3FFF;
        return width > 0 && height > 0;
    }

    private static bool TryReadWebpLossless(byte[] content, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (content.Length < 25 || content[20] != 0x2F)
        {
            return false;
        }

        var bits = BinaryPrimitives.ReadUInt32LittleEndian(content.AsSpan(21, 4));
        width = (int)((bits & 0x3FFF) + 1);
        height = (int)(((bits >> 14) & 0x3FFF) + 1);
        return width > 0 && height > 0;
    }
}
