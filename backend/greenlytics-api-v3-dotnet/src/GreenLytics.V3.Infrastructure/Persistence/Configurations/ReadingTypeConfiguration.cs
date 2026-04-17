using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLytics.V3.Infrastructure.Persistence.Configurations;

public sealed class ReadingTypeConfiguration : IEntityTypeConfiguration<ReadingType>
{
    public void Configure(EntityTypeBuilder<ReadingType> builder)
    {
        builder.ToTable("reading_types");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.Unit).HasColumnName("unit").HasMaxLength(30);
        builder.Property(x => x.ValueType).HasColumnName("value_type").HasMaxLength(20);
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
    }
}
