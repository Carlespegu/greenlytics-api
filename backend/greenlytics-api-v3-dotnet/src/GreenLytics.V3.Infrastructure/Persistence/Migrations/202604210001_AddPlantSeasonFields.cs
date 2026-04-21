using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenLytics.V3.Infrastructure.Persistence.Migrations;

[DbContext(typeof(GreenLyticsDbContext))]
[Migration("202604210001_AddPlantSeasonFields")]
public partial class AddPlantSeasonFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE plants
            ADD COLUMN IF NOT EXISTS flowering_months integer[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS fertilization_seasons text[] NOT NULL DEFAULT '{}';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE plants
            DROP COLUMN IF EXISTS flowering_months,
            DROP COLUMN IF EXISTS fertilization_seasons;
            """);
    }
}
