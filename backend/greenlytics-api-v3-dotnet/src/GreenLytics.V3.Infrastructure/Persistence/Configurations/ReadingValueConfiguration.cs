using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class ReadingValueConfiguration : IEntityTypeConfiguration<ReadingValue>
{
    public void Configure(EntityTypeBuilder<ReadingValue> builder)
    {
        builder.ToTable("reading_values");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ReadingId).HasColumnName("reading_id");
        builder.Property(x => x.ReadingTypeId).HasColumnName("reading_type_id");
        builder.Property(x => x.UnitTypeId).HasColumnName("unit_type_id");
        builder.Property(x => x.Value).HasColumnName("value").HasPrecision(18, 6);
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");

        builder.HasOne(x => x.ReadingType)
            .WithMany()
            .HasForeignKey(x => x.ReadingTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.UnitType)
            .WithMany()
            .HasForeignKey(x => x.UnitTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
