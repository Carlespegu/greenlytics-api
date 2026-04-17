using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Readings;

public sealed class ReadingsManagementValidationService
{
    private static readonly TimeSpan MaxTimeseriesWindow = TimeSpan.FromDays(366);

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;

    public ReadingsManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser, IClock clock)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
    }

    public async Task<ValidatedReadingsSearchRequest> ValidateSearchAsync(ReadingsSearchRequest request, CancellationToken cancellationToken = default)
    {
        ReadingsManagementPolicy.RequireCanViewReadings(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var filters = request.Filters ?? new ReadingSearchFilters(null, null, null, null, null, null, null, null, null);
        SearchRequestValidation.EnsureDateRange(filters.DateFrom, filters.DateTo, "filters.dateFrom", "filters.dateTo");

        Guid? effectiveClientId;
        if (ReadingsManagementPolicy.IsAdmin(_currentUser))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                await EnsureClientExistsAsync(effectiveClientId.Value, "filters.clientId", cancellationToken);
            }
        }
        else
        {
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        if (filters.InstallationId.HasValue)
        {
            _ = await ValidateInstallationFilterAsync(filters.InstallationId.Value, effectiveClientId, cancellationToken, "filters.installationId");
        }

        if (filters.PlantId.HasValue)
        {
            _ = await ValidatePlantFilterAsync(filters.PlantId.Value, effectiveClientId, cancellationToken, "filters.plantId");
        }

        if (filters.DeviceId.HasValue)
        {
            _ = await ValidateDeviceFilterAsync(filters.DeviceId.Value, effectiveClientId, cancellationToken, "filters.deviceId");
        }

        ReadingType? readingType = null;
        if (filters.ReadingTypeId.HasValue)
        {
            readingType = await ValidateReadingTypeFilterAsync(filters.ReadingTypeId.Value, "filters.readingTypeId", cancellationToken);
        }

        if (filters.ValueMin.HasValue && filters.ValueMax.HasValue && filters.ValueMin.Value > filters.ValueMax.Value)
        {
            throw RequestValidationException.BadRequest(
                "filters.valueMin must be less than or equal to filters.valueMax.",
                RequestValidationException.Field("filters.valueMin", "invalid_range", "filters.valueMin must be less than or equal to filters.valueMax."),
                RequestValidationException.Field("filters.valueMax", "invalid_range", "filters.valueMin must be less than or equal to filters.valueMax."));
        }

        return new ValidatedReadingsSearchRequest(
            effectiveClientId,
            filters.DeviceId,
            filters.PlantId,
            filters.ReadingTypeId,
            filters.InstallationId,
            filters.DateFrom?.ToUniversalTime(),
            filters.DateTo?.ToUniversalTime(),
            filters.ValueMin,
            filters.ValueMax,
            readingType,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(request.Sort, "readAt", "readAt", "createdAt", "value"));
    }

    public async Task<ValidatedReadingsTimeseriesRequest> ValidateTimeseriesAsync(ReadingsTimeseriesRequest request, CancellationToken cancellationToken = default)
    {
        ReadingsManagementPolicy.RequireCanViewReadings(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var filters = request.Filters ?? new ReadingsTimeseriesFilters(null, null, null, null, null, null, null);

        if (!filters.ReadingTypeId.HasValue)
        {
            throw RequestValidationException.BadRequest(
                "filters.readingTypeId is required.",
                RequestValidationException.Field("filters.readingTypeId", "required", "filters.readingTypeId is required."));
        }

        if (!filters.DateFrom.HasValue || !filters.DateTo.HasValue)
        {
            throw RequestValidationException.BadRequest(
                "filters.dateFrom and filters.dateTo are required.",
                RequestValidationException.Field("filters.dateFrom", "required", "filters.dateFrom and filters.dateTo are required."),
                RequestValidationException.Field("filters.dateTo", "required", "filters.dateFrom and filters.dateTo are required."));
        }

        var from = filters.DateFrom.Value.ToUniversalTime();
        var to = filters.DateTo.Value.ToUniversalTime();
        SearchRequestValidation.EnsureDateRange(from, to, "filters.dateFrom", "filters.dateTo");

        if (to - from > MaxTimeseriesWindow)
        {
            throw RequestValidationException.BadRequest(
                $"Timeseries range cannot exceed {MaxTimeseriesWindow.Days} days.",
                RequestValidationException.Field("filters.dateTo", "invalid_range", $"Timeseries range cannot exceed {MaxTimeseriesWindow.Days} days."));
        }

        Guid? effectiveClientId;
        if (ReadingsManagementPolicy.IsAdmin(_currentUser))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                await EnsureClientExistsAsync(effectiveClientId.Value, "filters.clientId", cancellationToken);
            }
        }
        else
        {
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        if (filters.InstallationId.HasValue)
        {
            _ = await ValidateInstallationFilterAsync(filters.InstallationId.Value, effectiveClientId, cancellationToken, "filters.installationId");
        }

        if (filters.PlantId.HasValue)
        {
            _ = await ValidatePlantFilterAsync(filters.PlantId.Value, effectiveClientId, cancellationToken, "filters.plantId");
        }

        if (filters.DeviceId.HasValue)
        {
            _ = await ValidateDeviceFilterAsync(filters.DeviceId.Value, effectiveClientId, cancellationToken, "filters.deviceId");
        }

        var readingType = await ValidateReadingTypeFilterAsync(filters.ReadingTypeId.Value, "filters.readingTypeId", cancellationToken);
        if (!IsNumericValueType(readingType.ValueType))
        {
            throw RequestValidationException.BadRequest(
                "Timeseries metrics are only available for numeric reading types.",
                RequestValidationException.Field("filters.readingTypeId", "unsupported_value_type", "Timeseries metrics are only available for numeric reading types."));
        }

        return new ValidatedReadingsTimeseriesRequest(
            effectiveClientId,
            filters.DeviceId,
            filters.PlantId,
            filters.ReadingTypeId.Value,
            filters.InstallationId,
            from,
            to,
            readingType,
            NormalizeGroupBy(request.GroupBy),
            NormalizeMetrics(request.Metrics));
    }

    private static bool IsNumericValueType(string valueType)
        => (valueType ?? string.Empty).Trim().ToLowerInvariant() is "decimal" or "numeric" or "number" or "float" or "double" or "integer" or "int";

    private static string NormalizeGroupBy(string? groupBy)
        => (groupBy ?? "hour").Trim().ToLowerInvariant() switch
        {
            "hour" => "hour",
            "day" => "day",
            _ => throw RequestValidationException.BadRequest(
                "groupBy must be 'hour' or 'day'.",
                RequestValidationException.Field("groupBy", "unsupported", "groupBy must be 'hour' or 'day'."))
        };

    private static IReadOnlyList<string> NormalizeMetrics(IReadOnlyList<string>? metrics)
    {
        var normalized = (metrics is null || metrics.Count == 0 ? new[] { "avg", "min", "max" } : metrics)
            .Select(x => x?.Trim().ToLowerInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (normalized.Any(x => x is not ("avg" or "min" or "max")))
        {
            throw RequestValidationException.BadRequest(
                "metrics only supports avg, min and max.",
                RequestValidationException.Field("metrics", "unsupported", "metrics only supports avg, min and max."));
        }

        return normalized;
    }

    private async Task EnsureClientExistsAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Clients.AsNoTracking().AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested client does not exist."));
        }
    }

    private async Task<Installation> ValidateInstallationFilterAsync(Guid installationId, Guid? effectiveClientId, CancellationToken cancellationToken, string fieldName)
    {
        var query = _dbContext.Installations.AsNoTracking().Where(x => x.Id == installationId && !x.IsDeleted);
        if (effectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == effectiveClientId.Value);
        }

        var installation = await query.SingleOrDefaultAsync(cancellationToken);
        if (installation is null)
        {
            throw effectiveClientId.HasValue && !ReadingsManagementPolicy.IsAdmin(_currentUser)
                ? new ForbiddenOperationException("The requested installation is not available for the current user.")
                : RequestValidationException.BadRequest(
                    "The requested installation does not exist.",
                    RequestValidationException.Field(fieldName, "not_found", "The requested installation does not exist."));
        }

        return installation;
    }

    private async Task<Plant> ValidatePlantFilterAsync(Guid plantId, Guid? effectiveClientId, CancellationToken cancellationToken, string fieldName)
    {
        var query = _dbContext.Plants.AsNoTracking().Where(x => x.Id == plantId && !x.IsDeleted);
        if (effectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == effectiveClientId.Value);
        }

        var plant = await query.SingleOrDefaultAsync(cancellationToken);
        if (plant is null)
        {
            throw effectiveClientId.HasValue && !ReadingsManagementPolicy.IsAdmin(_currentUser)
                ? new ForbiddenOperationException("The requested plant is not available for the current user.")
                : RequestValidationException.BadRequest(
                    "The requested plant does not exist.",
                    RequestValidationException.Field(fieldName, "not_found", "The requested plant does not exist."));
        }

        return plant;
    }

    private async Task<Device> ValidateDeviceFilterAsync(Guid deviceId, Guid? effectiveClientId, CancellationToken cancellationToken, string fieldName)
    {
        var deviceExists = await _dbContext.Devices.AsNoTracking().AnyAsync(x => x.Id == deviceId && !x.IsDeleted, cancellationToken);
        if (!deviceExists)
        {
            throw RequestValidationException.BadRequest(
                "The requested device does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested device does not exist."));
        }

        if (effectiveClientId.HasValue)
        {
            var hasScope = await _dbContext.Readings.AsNoTracking().AnyAsync(x => x.DeviceId == deviceId && x.ClientId == effectiveClientId.Value, cancellationToken)
                || await (
                    from assignment in _dbContext.InstallationDevices.AsNoTracking().Where(x => x.IsActive && x.UnassignedAt == null)
                    join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
                        on assignment.InstallationId equals installation.Id
                    where assignment.DeviceId == deviceId && installation.ClientId == effectiveClientId.Value
                    select assignment.DeviceId)
                    .AnyAsync(cancellationToken);

            if (!hasScope)
            {
                throw new ForbiddenOperationException("The requested device is not available for the current user.");
            }
        }

        return await _dbContext.Devices.AsNoTracking().SingleAsync(x => x.Id == deviceId, cancellationToken);
    }

    private async Task<ReadingType> ValidateReadingTypeFilterAsync(Guid readingTypeId, string fieldName, CancellationToken cancellationToken)
    {
        var readingType = await _dbContext.ReadingTypes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == readingTypeId && x.IsActive, cancellationToken);
        if (readingType is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested reading type does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested reading type does not exist."));
        }

        return readingType;
    }
}

public sealed record ValidatedReadingsSearchRequest(Guid? EffectiveClientId, Guid? DeviceId, Guid? PlantId, Guid? ReadingTypeId, Guid? InstallationId, DateTime? DateFrom, DateTime? DateTo, decimal? ValueMin, decimal? ValueMax, ReadingType? ReadingType, SearchPagination Pagination, NormalizedSort Sort);
public sealed record ValidatedReadingsTimeseriesRequest(Guid? EffectiveClientId, Guid? DeviceId, Guid? PlantId, Guid ReadingTypeId, Guid? InstallationId, DateTime DateFrom, DateTime DateTo, ReadingType ReadingType, string GroupBy, IReadOnlyList<string> Metrics);





