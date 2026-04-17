namespace GreenLytics.V3.Application.Abstractions;

public interface IPhotoStorageService
{
    Task<string> UploadAsync(string storagePath, Stream content, string mimeType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default);
    Task<byte[]> DownloadAsync(string storagePath, CancellationToken cancellationToken = default);
    Task<string?> CreateSignedUrlAsync(string storagePath, CancellationToken cancellationToken = default);
}
