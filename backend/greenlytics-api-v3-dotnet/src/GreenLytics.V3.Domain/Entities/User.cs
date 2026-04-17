using GreenLytics.V3.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenLytics.V3.Domain.Entities;

public sealed class User : BaseAuditableEntity
{
    public Guid ClientId { get; set; }
    public Guid RoleId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string? ExternalAuthId { get; set; }
    public bool IsActive { get; set; } = true;

    public Role? Role { get; set; }
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();

    [NotMapped]
    public Guid? SupabaseAuthUserId
    {
        get => Guid.TryParse(ExternalAuthId, out var parsed) ? parsed : null;
        set => ExternalAuthId = value?.ToString();
    }

    [NotMapped]
    public string Username
    {
        get => Code ?? string.Empty;
        set => Code = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [NotMapped]
    public string? FirstName
    {
        get => Name;
        set
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                Name = value.Trim();
            }
        }
    }

    [NotMapped]
    public string? LastName
    {
        get => null;
        set { }
    }

    [NotMapped]
    public DateTime? LastLoginOn
    {
        get => UpdatedAt;
        set => UpdatedAt = value;
    }
}
