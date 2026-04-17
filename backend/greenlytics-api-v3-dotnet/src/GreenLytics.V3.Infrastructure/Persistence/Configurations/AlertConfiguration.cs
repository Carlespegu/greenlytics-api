using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.ToTable("alerts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ClientId).HasColumnName("client_id");
        builder.Property(x => x.InstallationId).HasColumnName("installation_id");
        builder.Property(x => x.PlantId).HasColumnName("plant_id");
        builder.Property(x => x.ReadingTypeId).HasColumnName("reading_type_id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(150);
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(x => x.Channel).HasColumnName("channel").HasMaxLength(30);
        builder.Property(x => x.RecipientEmail).HasColumnName("recipient_email").HasMaxLength(255);
        builder.Property(x => x.ConditionType).HasColumnName("condition_type").HasMaxLength(30);
        builder.Property(x => x.ValueType).HasColumnName("value_type").HasMaxLength(20);
        builder.Property(x => x.MinValue).HasColumnName("min_value");
        builder.Property(x => x.MaxValue).HasColumnName("max_value");
        builder.Property(x => x.ExactNumericValue).HasColumnName("exact_numeric_value");
        builder.Property(x => x.ExactTextValue).HasColumnName("exact_text_value").HasMaxLength(255);
        builder.Property(x => x.ExactBooleanValue).HasColumnName("exact_boolean_value");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.UpdatedByUserId).HasColumnName("updated_by_user_id");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
    }
}
