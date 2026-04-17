using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Client> Clients { get; }
    DbSet<Alert> Alerts { get; }
    DbSet<Device> Devices { get; }
    DbSet<DeviceType> DeviceTypes { get; }
    DbSet<Plant> Plants { get; }
    DbSet<PlantThreshold> PlantThresholds { get; }
    DbSet<PlantEvent> PlantEvents { get; }
    DbSet<PlantType> PlantTypes { get; }
    DbSet<PlantingType> PlantingTypes { get; }
    DbSet<LocationType> LocationTypes { get; }
    DbSet<Installation> Installations { get; }
    DbSet<InstallationDevice> InstallationDevices { get; }
    DbSet<Photo> Photos { get; }
    DbSet<PhotoType> PhotoTypes { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Reading> Readings { get; }
    DbSet<ReadingValue> ReadingValues { get; }
    DbSet<ReadingType> ReadingTypes { get; }
    DbSet<TypeCatalog> Types { get; }
    DbSet<UserSession> UserSessions { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}


