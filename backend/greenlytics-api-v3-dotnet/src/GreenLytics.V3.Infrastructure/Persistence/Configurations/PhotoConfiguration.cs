using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.ToTable("photos");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.PlantId).HasColumnName("plant_id");
        builder.Property(x => x.PhotoTypeId).HasColumnName("photo_type_id");
        builder.Property(x => x.FileName).HasColumnName("file_name");
        builder.Property(x => x.FileUrl).HasColumnName("file_url");
        builder.Property(x => x.IsPrimary).HasColumnName("is_primary");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        builder.HasIndex(x => x.PlantId)
            .HasFilter("is_deleted = false and is_primary = true")
            .IsUnique();
    }
}
