using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

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
}
