using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("devices");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ClientId).HasColumnName("client_id");
        builder.Property(x => x.InstallationId).HasColumnName("installation_id");
        builder.Property(x => x.DeviceTypeId).HasColumnName("device_type_id");
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(150);
        builder.Property(x => x.SerialNumber).HasColumnName("serial_number").HasMaxLength(100);
        builder.Property(x => x.FirmwareVersion).HasColumnName("firmware_version").HasMaxLength(50);
        builder.Property(x => x.DeviceSecretHash).HasColumnName("device_secret_hash");
        builder.Property(x => x.SecretRotatedAt).HasColumnName("secret_rotated_at");
        builder.Property(x => x.LastAuthenticatedAt).HasColumnName("last_authenticated_at");
        builder.Property(x => x.LastSeenAt).HasColumnName("last_seen_at");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        builder.HasOne(x => x.Installation)
            .WithMany(x => x.Devices)
            .HasForeignKey(x => x.InstallationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.Code)
            .IsUnique()
            .HasFilter("is_deleted = false");

        builder.HasIndex(x => x.SerialNumber)
            .IsUnique()
            .HasFilter("is_deleted = false and serial_number is not null");
    }
}
