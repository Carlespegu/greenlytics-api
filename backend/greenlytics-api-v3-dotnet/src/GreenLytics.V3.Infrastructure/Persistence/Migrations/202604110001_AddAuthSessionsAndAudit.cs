using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace GreenLytics.V3.Infrastructure.Persistence.Migrations;

[DbContext(typeof(GreenLyticsDbContext))]
[Migration("202604110001_AddAuthSessionsAndAudit")]
public partial class AddAuthSessionsAndAudit : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS supabaseauthuserid uuid NULL;
            """);

        migrationBuilder.Sql(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS deletedby text NULL;
            """);

        migrationBuilder.Sql(
            """
            ALTER TABLE plants
            ADD COLUMN IF NOT EXISTS deletedby text NULL;
            """);

        migrationBuilder.Sql(
            """
            ALTER TABLE photo_types
            ADD COLUMN IF NOT EXISTS modifiedon timestamp without time zone NULL,
            ADD COLUMN IF NOT EXISTS modifiedby text NULL,
            ADD COLUMN IF NOT EXISTS deletedby text NULL,
            ADD COLUMN IF NOT EXISTS deletedon timestamp without time zone NULL,
            ADD COLUMN IF NOT EXISTS isdeleted boolean NOT NULL DEFAULT false;
            """);

        migrationBuilder.Sql(
            """
            ALTER TABLE roles
            ADD COLUMN IF NOT EXISTS description text NULL,
            ADD COLUMN IF NOT EXISTS isactive boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS createdon timestamp without time zone NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS createdby text NULL,
            ADD COLUMN IF NOT EXISTS modifiedon timestamp without time zone NULL,
            ADD COLUMN IF NOT EXISTS modifiedby text NULL,
            ADD COLUMN IF NOT EXISTS deletedby text NULL,
            ADD COLUMN IF NOT EXISTS deletedon timestamp without time zone NULL,
            ADD COLUMN IF NOT EXISTS isdeleted boolean NOT NULL DEFAULT false;
            """);

        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS usersessions
            (
                id uuid PRIMARY KEY,
                userid uuid NOT NULL,
                sessionid uuid NOT NULL,
                accesstokenjti varchar(255) NULL,
                accesstokenhash varchar(128) NOT NULL,
                refreshtokenhash varchar(128) NOT NULL,
                refreshtokenexpireson timestamp without time zone NOT NULL,
                expireson timestamp without time zone NOT NULL,
                revokedon timestamp without time zone NULL,
                revokedby varchar(100) NULL,
                isactive boolean NOT NULL DEFAULT true,
                ipaddress varchar(128) NULL,
                useragent varchar(1024) NULL,
                createdon timestamp without time zone NOT NULL DEFAULT now(),
                createdby text NULL,
                modifiedon timestamp without time zone NULL,
                modifiedby text NULL,
                deletedby text NULL,
                deletedon timestamp without time zone NULL,
                isdeleted boolean NOT NULL DEFAULT false,
                CONSTRAINT fk_usersessions_users_userid FOREIGN KEY (userid) REFERENCES users (id) ON DELETE RESTRICT
            );
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_users_supabaseauthuserid
            ON users (supabaseauthuserid)
            WHERE supabaseauthuserid IS NOT NULL;
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_roles_code
            ON roles (code);
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_usersessions_sessionid
            ON usersessions (sessionid);
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_usersessions_accesstokenhash
            ON usersessions (accesstokenhash);
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_usersessions_refreshtokenhash
            ON usersessions (refreshtokenhash);
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS ix_usersessions_userid_isactive
            ON usersessions (userid, isactive);
            """);

        migrationBuilder.Sql(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ux_usersessions_single_active_user
            ON usersessions (userid)
            WHERE isactive = true AND isdeleted = false AND revokedon IS NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP INDEX IF EXISTS ux_usersessions_single_active_user;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_usersessions_userid_isactive;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_usersessions_refreshtokenhash;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_usersessions_accesstokenhash;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_usersessions_sessionid;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_roles_code;");
        migrationBuilder.Sql("DROP INDEX IF EXISTS ix_users_supabaseauthuserid;");
        migrationBuilder.Sql("DROP TABLE IF EXISTS usersessions;");

        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS isdeleted;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS deletedon;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS deletedby;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS modifiedby;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS modifiedon;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS createdby;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS createdon;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS isactive;");
        migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS description;");

        migrationBuilder.Sql("ALTER TABLE photo_types DROP COLUMN IF EXISTS isdeleted;");
        migrationBuilder.Sql("ALTER TABLE photo_types DROP COLUMN IF EXISTS deletedon;");
        migrationBuilder.Sql("ALTER TABLE photo_types DROP COLUMN IF EXISTS deletedby;");
        migrationBuilder.Sql("ALTER TABLE photo_types DROP COLUMN IF EXISTS modifiedby;");
        migrationBuilder.Sql("ALTER TABLE photo_types DROP COLUMN IF EXISTS modifiedon;");

        migrationBuilder.Sql("ALTER TABLE plants DROP COLUMN IF EXISTS deletedby;");
        migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS deletedby;");
        migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS supabaseauthuserid;");
    }
}
