using System.Net.Http.Headers;
using System.Net.Http.Json;
using GreenLytics.V3.Application.Abstractions;
using Microsoft.Extensions.Configuration;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class SupabaseStorageService : IPhotoStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;
    private readonly string _bucket;

    public SupabaseStorageService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _supabaseUrl = ResolveRequiredSetting(
            configuration,
            "Supabase:Url",
            "SUPABASE_URL",
            "Authentication:Supabase:Url");
        _serviceRoleKey = ResolveRequiredSetting(
            configuration,
            "Supabase:ServiceRoleKey",
            "SUPABASE_SERVICE_ROLE_KEY",
            "Authentication:Supabase:ApiKey");
        _bucket = ResolveOptionalSetting(
                configuration,
                "Supabase:Bucket",
                "SUPABASE_STORAGE_BUCKET")
            ?? "photos_greenlytics";
    }

    public async Task<string> UploadAsync(string storagePath, Stream content, string mimeType, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{_bucket}/{storagePath.TrimStart('/')}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Headers.Add("x-upsert", "false");
        request.Content = new StreamContent(content);
        request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(mimeType);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return storagePath;
    }

    public async Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{_bucket}/{storagePath.TrimStart('/')}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task<byte[]> DownloadAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{_bucket}/{storagePath.TrimStart('/')}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    public async Task<string?> CreateSignedUrlAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/sign/{_bucket}/{storagePath.TrimStart('/')}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Content = JsonContent.Create(new { expiresIn = 3600 });

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var payload = await response.Content.ReadFromJsonAsync<SignedUrlResponse>(cancellationToken: cancellationToken);
        if (payload?.SignedUrl is null)
        {
            return null;
        }

        return payload.SignedUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? payload.SignedUrl
            : $"{_supabaseUrl.TrimEnd('/')}/storage/v1{payload.SignedUrl}";
    }

    private sealed record SignedUrlResponse(string? SignedUrl);

    private static string ResolveRequiredSetting(IConfiguration configuration, params string[] keys)
    {
        var value = ResolveOptionalSetting(configuration, keys);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{keys[0]} is missing.");
        }

        return value;
    }

    private static string? ResolveOptionalSetting(IConfiguration configuration, params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = configuration[key];
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }
}
