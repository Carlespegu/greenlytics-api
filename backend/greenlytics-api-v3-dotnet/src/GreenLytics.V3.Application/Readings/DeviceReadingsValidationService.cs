using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class DeviceReadingsValidationService
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly IDeviceSecretService _deviceSecretService;

    public DeviceReadingsValidationService(IAppDbContext dbContext, IClock clock, IDeviceSecretService deviceSecretService)
    {
        _dbContext = dbContext;
        _clock = clock;
        _deviceSecretService = deviceSecretService;
    }

    public async Task<ValidatedDeviceReadingsIngestRequest> ValidateIngestAsync(
        DeviceReadingRequest request,
        CancellationToken cancellationToken = default)
    {
        var deviceCode = (request.DeviceCode ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(deviceCode))
        {
            throw RequestValidationException.BadRequest(
                "deviceCode is required.",
                RequestValidationException.Field("deviceCode", "required", "deviceCode is required."));
        }

        var deviceSecret = (request.DeviceSecret ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(deviceSecret))
        {
            throw RequestValidationException.BadRequest(
                "deviceSecret is required.",
                RequestValidationException.Field("deviceSecret", "required", "deviceSecret is required."));
        }

        var device = await _dbContext.Devices
            .SingleOrDefaultAsync(x => x.Code == deviceCode && !x.IsDeleted, cancellationToken);

        if (device is null)
        {
            throw new EntityNotFoundException("The requested device does not exist.");
        }

        if (!device.IsActive)
        {
            throw RequestValidationException.BadRequest(
                "The requested device is inactive.",
                RequestValidationException.Field("deviceCode", "inactive", "The requested device is inactive."));
        }

        if (string.IsNullOrWhiteSpace(device.DeviceSecretHash))
        {
            throw new UnauthorizedAccessException("The requested device is not provisioned for secret-based authentication.");
        }

        if (!_deviceSecretService.VerifySecret(device.DeviceSecretHash, deviceSecret))
        {
            throw new UnauthorizedAccessException("Invalid device credentials.");
        }

        var readAt = request.ReadAt?.ToUniversalTime();
        if (!readAt.HasValue)
        {
            throw RequestValidationException.BadRequest(
                "readAt is required.",
                RequestValidationException.Field("readAt", "required", "readAt is required."));
        }

        if (readAt.Value > _clock.UtcNow.AddMinutes(10))
        {
            throw RequestValidationException.BadRequest(
                "readAt cannot be too far in the future.",
                RequestValidationException.Field("readAt", "future_out_of_range", "readAt cannot be too far in the future."));
        }

        var values = request.Values?.Where(x => x is not null).ToArray() ?? Array.Empty<DeviceReadingValueRequest>();
        if (values.Length == 0)
        {
            throw RequestValidationException.BadRequest(
                "values must contain at least one reading value.",
                RequestValidationException.Field("values", "required", "values must contain at least one reading value."));
        }

        var normalizedValues = new List<ValidatedDeviceReadingValue>(values.Length);
        var readingTypeCache = new Dictionary<string, TypeCatalog>(StringComparer.OrdinalIgnoreCase);
        var unitTypeCache = new Dictionary<string, TypeCatalog>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < values.Length; index++)
        {
            var value = values[index];
            var fieldPrefix = $"values[{index}]";
            var typeCode = (value.Type ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(typeCode))
            {
                throw RequestValidationException.BadRequest(
                    "type is required for every reading value.",
                    RequestValidationException.Field($"{fieldPrefix}.type", "required", "type is required for every reading value."));
            }

            if (!value.Value.HasValue)
            {
                throw RequestValidationException.BadRequest(
                    "value is required for every reading value.",
                    RequestValidationException.Field($"{fieldPrefix}.value", "required", "value is required for every reading value."));
            }

            var readingType = await ResolveTypeAsync(typeCode, "ReadingType", readingTypeCache, $"{fieldPrefix}.type", cancellationToken);

            TypeCatalog? unitType = null;
            if (!string.IsNullOrWhiteSpace(value.Unit))
            {
                unitType = await ResolveTypeAsync(value.Unit.Trim(), "UnitType", unitTypeCache, $"{fieldPrefix}.unit", cancellationToken);
            }

            normalizedValues.Add(new ValidatedDeviceReadingValue(readingType, unitType, value.Value.Value));
        }

        return new ValidatedDeviceReadingsIngestRequest(
            device,
            readAt.Value,
            NormalizeOptional(request.Source),
            normalizedValues);
    }

    public async Task<Device> ValidateDeviceCodeAsync(string deviceCode, CancellationToken cancellationToken = default)
    {
        var normalized = (deviceCode ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "deviceCode is required.",
                RequestValidationException.Field("deviceCode", "required", "deviceCode is required."));
        }

        var device = await _dbContext.Devices
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == normalized && !x.IsDeleted, cancellationToken);

        if (device is null)
        {
            throw new EntityNotFoundException("The requested device does not exist.");
        }

        if (!device.IsActive)
        {
            throw RequestValidationException.BadRequest(
                "The requested device is inactive.",
                RequestValidationException.Field("deviceCode", "inactive", "The requested device is inactive."));
        }

        return device;
    }

    private async Task<TypeCatalog> ResolveTypeAsync(
        string code,
        string category,
        IDictionary<string, TypeCatalog> cache,
        string fieldName,
        CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(code, out var cached))
        {
            return cached;
        }

        var type = await _dbContext.Types
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Category == category
                    && x.Code == code
                    && !x.IsDeleted
                    && x.IsActive,
                cancellationToken);

        if (type is null)
        {
            throw RequestValidationException.BadRequest(
                $"The provided {fieldName} value '{code}' is not valid.",
                RequestValidationException.Field(fieldName, "not_found", $"The provided {fieldName} value '{code}' is not valid."));
        }

        cache[code] = type;
        return type;
    }

    private static string? NormalizeOptional(string? input)
        => string.IsNullOrWhiteSpace(input) ? null : input.Trim();
}
