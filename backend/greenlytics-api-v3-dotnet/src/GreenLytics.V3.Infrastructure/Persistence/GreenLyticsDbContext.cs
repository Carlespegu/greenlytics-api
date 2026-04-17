using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Domain.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Infrastructure.Persistence.Configurations;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Infrastructure.Persistence;

public sealed class GreenLyticsDbContext : DbContext, IAppDbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly IClock? _clock;

    public GreenLyticsDbContext(DbContextOptions<GreenLyticsDbContext> options, IHttpContextAccessor? httpContextAccessor = null, IClock? clock = null) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
        _clock = clock;
    }

    public DbSet<Plant> Plants => Set<Plant>();
    public DbSet<PlantThreshold> PlantThresholds => Set<PlantThreshold>();
    public DbSet<PlantEvent> PlantEvents => Set<PlantEvent>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<DeviceType> DeviceTypes => Set<DeviceType>();
    public DbSet<Installation> Installations => Set<Installation>();
    public DbSet<InstallationDevice> InstallationDevices => Set<InstallationDevice>();
    public DbSet<PlantType> PlantTypes => Set<PlantType>();
    public DbSet<PlantingType> PlantingTypes => Set<PlantingType>();
    public DbSet<LocationType> LocationTypes => Set<LocationType>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<PhotoType> PhotoTypes => Set<PhotoType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Reading> Readings => Set<Reading>();
    public DbSet<ReadingValue> ReadingValues => Set<ReadingValue>();
    public DbSet<ReadingType> ReadingTypes => Set<ReadingType>();
    public DbSet<TypeCatalog> Types => Set<TypeCatalog>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new PlantConfiguration());
        modelBuilder.ApplyConfiguration(new PlantThresholdConfiguration());
        modelBuilder.ApplyConfiguration(new PlantEventConfiguration());
        modelBuilder.ApplyConfiguration(new AlertConfiguration());
        modelBuilder.ApplyConfiguration(new ClientConfiguration());
        modelBuilder.ApplyConfiguration(new DeviceConfiguration());
        modelBuilder.ApplyConfiguration(new DeviceTypeConfiguration());
        modelBuilder.ApplyConfiguration(new InstallationConfiguration());
        modelBuilder.ApplyConfiguration(new InstallationDeviceConfiguration());
        modelBuilder.ApplyConfiguration(new PlantTypeConfiguration());
        modelBuilder.ApplyConfiguration(new PlantingTypeConfiguration());
        modelBuilder.ApplyConfiguration(new LocationTypeConfiguration());
        modelBuilder.ApplyConfiguration(new PhotoConfiguration());
        modelBuilder.ApplyConfiguration(new PhotoTypeConfiguration());
        modelBuilder.ApplyConfiguration(new ReadingConfiguration());
        modelBuilder.ApplyConfiguration(new ReadingValueConfiguration());
        modelBuilder.ApplyConfiguration(new ReadingTypeConfiguration());
        modelBuilder.ApplyConfiguration(new TypeCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserSessionConfiguration());
        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyAuditRules();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditRules();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditRules()
    {
        var now = _clock?.UtcNow ?? DateTime.UtcNow;
        var principal = _httpContextAccessor?.HttpContext?.User;
        var actorUserId = Guid.TryParse(principal?.FindFirst(AuthClaimTypes.LocalUserId)?.Value, out var parsedActorUserId)
            ? parsedActorUserId
            : (Guid?)null;

        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedByUserId ??= actorUserId;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedByUserId = actorUserId;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedByUserId = actorUserId;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedByUserId = actorUserId;
                    break;
            }
        }
    }
}


