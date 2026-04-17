using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    private static readonly ValueConverter<Guid?, string?> NullableGuidToStringConverter = new(
        value => value.HasValue ? value.Value.ToString() : null,
        value => ParseNullableGuid(value));

    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("usersessions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("userid");
        builder.Property(x => x.SessionId).HasColumnName("sessionid");
        builder.Property(x => x.AccessTokenJti).HasColumnName("accesstokenjti").HasMaxLength(255);
        builder.Property(x => x.AccessTokenHash).HasColumnName("accesstokenhash").HasMaxLength(128);
        builder.Property(x => x.RefreshTokenHash).HasColumnName("refreshtokenhash").HasMaxLength(128);
        builder.Property(x => x.RefreshTokenExpiresOn).HasColumnName("refreshtokenexpireson");
        builder.Property(x => x.ExpiresOn).HasColumnName("expireson");
        builder.Property(x => x.RevokedOn).HasColumnName("revokedon");
        builder.Property(x => x.RevokedBy).HasColumnName("revokedby").HasMaxLength(100);
        builder.Property(x => x.IsActive).HasColumnName("isactive");
        builder.Property(x => x.IpAddress).HasColumnName("ipaddress").HasMaxLength(128);
        builder.Property(x => x.UserAgent).HasColumnName("useragent").HasMaxLength(1024);
        builder.Property(x => x.CreatedAt).HasColumnName("createdon");
        builder.Property(x => x.CreatedByUserId)
            .HasColumnName("createdby")
            .HasConversion(NullableGuidToStringConverter);
        builder.Property(x => x.UpdatedAt).HasColumnName("modifiedon");
        builder.Property(x => x.UpdatedByUserId)
            .HasColumnName("modifiedby")
            .HasConversion(NullableGuidToStringConverter);
        builder.Property(x => x.DeletedByUserId)
            .HasColumnName("deletedby")
            .HasConversion(NullableGuidToStringConverter);
        builder.Property(x => x.DeletedAt).HasColumnName("deletedon");
        builder.Property(x => x.IsDeleted).HasColumnName("isdeleted");

        builder.HasOne(x => x.User)
            .WithMany(x => x.Sessions)
            .HasForeignKey(x => x.UserId);

        builder.HasIndex(x => x.SessionId).IsUnique();
        builder.HasIndex(x => x.AccessTokenHash).IsUnique();
        builder.HasIndex(x => x.RefreshTokenHash).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.IsActive });
    }

    private static Guid? ParseNullableGuid(string? value)
        => Guid.TryParse(value, out var parsed) ? parsed : null;
}
