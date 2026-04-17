using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class InstallationDeviceConfiguration : IEntityTypeConfiguration<InstallationDevice>
{
    public void Configure(EntityTypeBuilder<InstallationDevice> builder)
    {
        builder.ToTable("installation_devices");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.InstallationId).HasColumnName("installation_id");
        builder.Property(x => x.DeviceId).HasColumnName("device_id");
        builder.Property(x => x.AssignedAt).HasColumnName("assigned_at");
        builder.Property(x => x.UnassignedAt).HasColumnName("unassigned_at");
        builder.Property(x => x.Notes).HasColumnName("notes");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
    }
}
