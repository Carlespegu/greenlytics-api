using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace GreenLytics.V3.Application.Readings;

public sealed class IngestDeviceReadingsHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly DeviceReadingsValidationService _validationService;

    public IngestDeviceReadingsHandler(
        IAppDbContext dbContext,
        IClock clock,
        DeviceReadingsValidationService validationService)
    {
        _dbContext = dbContext;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task<DeviceReadingsIngestResult> HandleAsync(
        DeviceReadingRequest request,
        CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateIngestAsync(request, cancellationToken);
        var now = _clock.UtcNow;
        IDbContextTransaction? transaction = null;

        try
        {
            if (_dbContext is DbContext efDbContext)
            {
                transaction = await efDbContext.Database.BeginTransactionAsync(cancellationToken);
            }

            var reading = new Reading
            {
                Id = Guid.NewGuid(),
                ClientId = validated.Device.ClientId,
                InstallationId = validated.Device.InstallationId,
                DeviceId = validated.Device.Id,
                ReadAt = validated.ReadAt,
                Source = validated.Source,
                IsDeleted = false,
                CreatedAt = now,
                CreatedByUserId = null,
            };

            validated.Device.LastAuthenticatedAt = now;
            validated.Device.LastSeenAt = validated.ReadAt;
            _dbContext.Readings.Add(reading);

            foreach (var value in validated.Values)
            {
                _dbContext.ReadingValues.Add(new ReadingValue
                {
                    Id = Guid.NewGuid(),
                    ReadingId = reading.Id,
                    ReadingTypeId = value.ReadingType.Id,
                    UnitTypeId = value.UnitType?.Id,
                    Value = value.Value,
                    IsDeleted = false,
                    CreatedAt = now,
                    CreatedByUserId = null,
                });
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return new DeviceReadingsIngestResult(
                reading.Id,
                validated.Device.Id,
                validated.Device.Code,
                reading.ReadAt,
                reading.Source,
                validated.Values
                    .Select(value => new ReadingValueDto(
                        value.ReadingType.Id,
                        value.ReadingType.Code,
                        value.UnitType?.Code,
                        value.Value))
                    .ToArray());
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }

            throw;
        }
        finally
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync();
            }
        }
    }
}
