using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class PlantThresholdConfiguration : IEntityTypeConfiguration<PlantThreshold>
{
    public void Configure(EntityTypeBuilder<PlantThreshold> builder)
    {
        builder.ToTable("plant_thresholds");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.PlantId).HasColumnName("plant_id");
        builder.Property(x => x.ReadingTypeId).HasColumnName("reading_type_id");
        builder.Property(x => x.UnitTypeId).HasColumnName("unit_type_id");
        builder.Property(x => x.MinValue).HasColumnName("min_value");
        builder.Property(x => x.MaxValue).HasColumnName("max_value");
        builder.Property(x => x.OptimalValue).HasColumnName("optimal_value");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        builder.HasIndex(x => new { x.PlantId, x.ReadingTypeId })
            .IsUnique()
            .HasFilter("is_deleted = false");
    }
}
