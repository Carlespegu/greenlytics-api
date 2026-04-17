using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class PlantEventConfiguration : IEntityTypeConfiguration<PlantEvent>
{
    public void Configure(EntityTypeBuilder<PlantEvent> builder)
    {
        builder.ToTable("plant_events");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ClientId).HasColumnName("client_id");
        builder.Property(x => x.PlantId).HasColumnName("plant_id");
        builder.Property(x => x.EventTypeId).HasColumnName("event_type_id");
        builder.Property(x => x.Title).HasColumnName("title");
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.Notes).HasColumnName("notes");
        builder.Property(x => x.EventDate).HasColumnName("event_date");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");
    }
}
