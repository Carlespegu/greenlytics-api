using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class PlantConfiguration : IEntityTypeConfiguration<Plant>
{
    public void Configure(EntityTypeBuilder<Plant> builder)
    {
        builder.ToTable("plants");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ClientId).HasColumnName("client_id");
        builder.Property(x => x.InstallationId).HasColumnName("installation_id");
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(150);
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.PlantTypeId).HasColumnName("plant_type_id");
        builder.Property(x => x.PlantStatusId).HasColumnName("plant_status_id");
        builder.Property(x => x.FloweringMonths).HasColumnName("flowering_months");
        builder.Property(x => x.FertilizationSeasons).HasColumnName("fertilization_seasons");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        builder.HasOne(x => x.Installation)
            .WithMany(x => x.Plants)
            .HasForeignKey(x => x.InstallationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.ClientId, x.Code })
            .IsUnique()
            .HasFilter("is_deleted = false");
    }
}
