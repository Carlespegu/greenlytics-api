using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenLytics.V3.Infrastructure.Persistence.Migrations;

[DbContext(typeof(GreenLyticsDbContext))]
[Migration("202607140001_MakePlantInstallationOptional")]
public partial class MakePlantInstallationOptional : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE plants
            ALTER COLUMN installation_id DROP NOT NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE plants
            ALTER COLUMN installation_id SET NOT NULL;
            """);
    }
}
