using System.Security.Claims;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class CurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly GreenLyticsDbContext _dbContext;

    private bool _resolved;
    private Guid? _userId;
    private string? _email;
    private Guid? _roleId;
    private string? _roleCode;
    private Guid? _clientId;
    private string? _username;

    public CurrentUserAccessor(IHttpContextAccessor httpContextAccessor, GreenLyticsDbContext dbContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
    }

    public Guid? UserId
    {
        get
        {
            EnsureResolved();
            return _userId;
        }
    }

    public string? Email
    {
        get
        {
            EnsureResolved();
            return _email;
        }
    }

    public Guid? RoleId
    {
        get
        {
            EnsureResolved();
            return _roleId;
        }
    }

    public string? RoleCode
    {
        get
        {
            EnsureResolved();
            return _roleCode;
        }
    }

    public Guid? ClientId
    {
        get
        {
            EnsureResolved();
            return _clientId;
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

    public string? Username
    {
        get
        {
            EnsureResolved();
            return _username;
        }
    }

    private void EnsureResolved()
    {
        if (_resolved)
        {
            return;
        }

        _resolved = true;
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return;
        }

        _email = GetClaim(AuthClaimTypes.Email) ?? GetClaim(ClaimTypes.Email);

        var localUserId = ParseGuid(AuthClaimTypes.LocalUserId);
        var supabaseUserId = ParseGuid(AuthClaimTypes.SupabaseUserId);
        if (!localUserId.HasValue && !supabaseUserId.HasValue && string.IsNullOrWhiteSpace(_email))
        {
            return;
        }

        var user = _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .FirstOrDefault(x =>
                !x.IsDeleted &&
                ((localUserId.HasValue && x.Id == localUserId.Value) ||
                 (supabaseUserId.HasValue && x.ExternalAuthId == supabaseUserId.Value.ToString()) ||
                 (!string.IsNullOrWhiteSpace(_email) && x.Email == _email)));

        if (user is null)
        {
            return;
        }

        _userId = user.Id;
        _email = user.Email;
        _roleId = user.RoleId;
        _roleCode = user.Role?.Code;
        _clientId = user.ClientId;
        _username = user.Code ?? user.Name;
    }

    private string? GetClaim(string claimType)
        => _httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x => x.Type == claimType)?.Value;

    private Guid? ParseGuid(string claimType)
        => Guid.TryParse(GetClaim(claimType), out var value) ? value : null;
}
