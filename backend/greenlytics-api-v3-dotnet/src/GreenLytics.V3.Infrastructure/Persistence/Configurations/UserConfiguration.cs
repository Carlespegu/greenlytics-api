using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ClientId).HasColumnName("client_id");
        builder.Property(x => x.RoleId).HasColumnName("role_id");
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(100);
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(150);
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash");
        builder.Property(x => x.ExternalAuthId).HasColumnName("external_auth_id");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        builder.Ignore(x => x.SupabaseAuthUserId);
        builder.Ignore(x => x.Username);
        builder.Ignore(x => x.FirstName);
        builder.Ignore(x => x.LastName);
        builder.Ignore(x => x.LastLoginOn);

        builder.HasOne(x => x.Role)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.RoleId);

        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => x.ExternalAuthId);
    }
}
