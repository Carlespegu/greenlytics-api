using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GreenLytics.V3.Infrastructure.Persistence;

public sealed class DesignTimeGreenLyticsDbContextFactory : IDesignTimeDbContextFactory<GreenLyticsDbContext>
{
    public GreenLyticsDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var apiProjectPath = Path.Combine(basePath, "..", "GreenLytics.V3.Api");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.Exists(apiProjectPath) ? apiProjectPath : basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = GetFirstConfiguredValue(
                configuration.GetConnectionString("DefaultConnection"),
                configuration["Database:ConnectionString"])
            ?? throw new InvalidOperationException("Database connection string is missing.");
        connectionString = NormalizePostgresConnectionString(connectionString);

        var optionsBuilder = new DbContextOptionsBuilder<GreenLyticsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new GreenLyticsDbContext(optionsBuilder.Options);
    }

    private static string? GetFirstConfiguredValue(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    private static string NormalizePostgresConnectionString(string connectionString)
    {
        if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgresql" && uri.Scheme != "postgres"))
        {
            return connectionString;
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = uri.AbsolutePath.Trim('/'),
            Username = Uri.UnescapeDataString(uri.UserInfo.Split(':', 2)[0]),
            SslMode = SslMode.Require,
            TrustServerCertificate = true,
        };

        if (uri.UserInfo.Contains(':'))
        {
            builder.Password = Uri.UnescapeDataString(uri.UserInfo.Split(':', 2)[1]);
        }

        var query = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var segment in query)
        {
            var pair = segment.Split('=', 2);
            if (pair.Length != 2)
            {
                continue;
            }

            var key = Uri.UnescapeDataString(pair[0]);
            var value = Uri.UnescapeDataString(pair[1]);

            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase)
                && Enum.TryParse<SslMode>(value, true, out var sslMode))
            {
                builder.SslMode = sslMode;
            }

            if (key.Equals("trust server certificate", StringComparison.OrdinalIgnoreCase)
                || key.Equals("trust_server_certificate", StringComparison.OrdinalIgnoreCase))
            {
                builder.TrustServerCertificate = value.Equals("true", StringComparison.OrdinalIgnoreCase)
                    || value == "1";
            }
        }

        return builder.ConnectionString;
    }
}
