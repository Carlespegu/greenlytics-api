using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Infrastructure.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class SupabaseAuthGateway : ISupabaseAuthGateway
{
    private readonly HttpClient _httpClient;
    private readonly SupabaseAuthenticationOptions _options;
    private readonly string _serviceRoleKey;

    public SupabaseAuthGateway(HttpClient httpClient, IOptions<SupabaseAuthenticationOptions> options, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _serviceRoleKey = ResolveRequiredSetting(
            configuration,
            "Authentication:Supabase:ServiceRoleKey",
            "SUPABASE_SERVICE_ROLE_KEY",
            "Supabase:ServiceRoleKey");
    }

    public async Task<SupabaseAuthTokens> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "token?grant_type=password");
        request.Content = JsonContent.Create(new
        {
            email,
            password,
        });

        var response = await SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<SupabaseTokenResponse>(cancellationToken: cancellationToken)
            ?? throw new UnauthorizedAccessException("Supabase Auth returned an empty login response.");

        return payload.ToTokens();
    }

    public async Task<SupabaseAuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "token?grant_type=refresh_token");
        request.Content = JsonContent.Create(new
        {
            refresh_token = refreshToken,
        });

        var response = await SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<SupabaseTokenResponse>(cancellationToken: cancellationToken)
            ?? throw new UnauthorizedAccessException("Supabase Auth returned an empty refresh response.");

        return payload.ToTokens();
    }

    public async Task<SupabaseProvisionedUser> CreateUserWithPasswordAsync(SupabaseAdminCreateUserRequest request, CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "admin/users");
        httpRequest.Content = JsonContent.Create(new
        {
            email = request.Email,
            password = request.Password,
            email_confirm = request.EmailConfirmed,
            user_metadata = new
            {
                name = request.Name,
                code = request.Code,
            },
        });

        var response = await SendAdminAsync(httpRequest, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<SupabaseAdminUserResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Supabase admin create user returned an empty response.");
        return payload.ToProvisionedUser();
    }

    public async Task<SupabaseProvisionedUser> InviteUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "invite");
        httpRequest.Content = JsonContent.Create(new
        {
            email,
        });

        var response = await SendAdminAsync(httpRequest, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<SupabaseAdminUserResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Supabase invite user returned an empty response.");
        return payload.ToProvisionedUser();
    }

    public async Task<SupabaseProvisionedUser> UpdateUserAsync(Guid userId, SupabaseAdminUpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, $"admin/users/{userId}");
        httpRequest.Content = JsonContent.Create(new
        {
            email = request.Email,
            password = request.Password,
            email_confirm = request.EmailConfirmed,
            user_metadata = new
            {
                name = request.Name,
                code = request.Code,
            },
        });

        var response = await SendAdminAsync(httpRequest, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<SupabaseAdminUserResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Supabase update user returned an empty response.");
        return payload.ToProvisionedUser();
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Delete, $"admin/users/{userId}");
        var response = await SendAdminAsync(httpRequest, cancellationToken);
        response.Dispose();
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.Add("apikey", _options.ApiKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return response;
        }

        var detail = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new UnauthorizedAccessException($"Supabase Auth request failed with status {(int)response.StatusCode}: {detail}");
    }

    private async Task<HttpResponseMessage> SendAdminAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return response;
        }

        var detail = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException($"Supabase admin request failed with status {(int)response.StatusCode}: {detail}");
    }

    private sealed class SupabaseTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = "bearer";

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("user")]
        public SupabaseUserResponse? User { get; set; }

        public SupabaseAuthTokens ToTokens()
        {
            var claims = JwtTokenReader.Read(AccessToken);
            return new SupabaseAuthTokens(
                AccessToken,
                RefreshToken,
                TokenType,
                ExpiresIn,
                User?.Id ?? claims.Subject ?? throw new UnauthorizedAccessException("Supabase Auth token does not contain a user id."),
                User?.Email ?? claims.Email);
        }
    }

    private sealed class SupabaseUserResponse
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }

    private sealed class SupabaseAdminUserResponse
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        public SupabaseProvisionedUser ToProvisionedUser()
            => new(
                Id,
                Email ?? string.Empty);
    }

    private static string ResolveRequiredSetting(IConfiguration configuration, params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = configuration[key];
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        throw new InvalidOperationException($"{keys[0]} is missing.");
    }
}
