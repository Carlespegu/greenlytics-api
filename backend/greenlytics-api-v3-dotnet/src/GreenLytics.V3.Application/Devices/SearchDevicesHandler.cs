using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Devices;

public sealed class SearchDevicesHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly DeviceManagementValidationService _validationService;

    public SearchDevicesHandler(IAppDbContext dbContext, DeviceManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<PagedResult<DeviceListItemDto>> HandleAsync(DevicesSearchRequest request, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateSearchAsync(request, cancellationToken);

        var query =
            from device in _dbContext.Devices.AsNoTracking()
            join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
                on device.InstallationId equals installation.Id into installationGroup
            from installation in installationGroup.DefaultIfEmpty()
            join deviceType in _dbContext.Types.AsNoTracking().Where(x => x.Category == "DeviceType" && !x.IsDeleted)
                on device.DeviceTypeId equals deviceType.Id into deviceTypeGroup
            from deviceType in deviceTypeGroup.DefaultIfEmpty()
            where !device.IsDeleted
            select new
            {
                device.Id,
                device.ClientId,
                device.InstallationId,
                device.DeviceTypeId,
                device.Code,
                device.Name,
                device.SerialNumber,
                device.FirmwareVersion,
                device.LastSeenAt,
                device.LastAuthenticatedAt,
                device.IsActive,
                HasSecretConfigured = device.DeviceSecretHash != null && device.DeviceSecretHash != string.Empty,
                InstallationName = installation != null ? installation.Name : null,
                DeviceTypeName = deviceType != null ? deviceType.Name : null,
                LatestReadingAt = _dbContext.Readings
                    .Where(x => x.DeviceId == device.Id && !x.IsDeleted)
                    .Max(x => (DateTime?)x.ReadAt),
                device.CreatedAt,
                device.UpdatedAt
            };

        if (validated.EffectiveClientId.HasValue)
        {
            query = query.Where(x => x.ClientId == validated.EffectiveClientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(validated.Code))
        {
            var code = validated.Code.ToLowerInvariant();
            query = query.Where(x => x.Code.ToLower().Contains(code));
        }

        if (!string.IsNullOrWhiteSpace(validated.Name))
        {
            var name = validated.Name.ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(validated.SerialNumber))
        {
            var serialNumber = validated.SerialNumber.ToLowerInvariant();
            query = query.Where(x => x.SerialNumber != null && x.SerialNumber.ToLower().Contains(serialNumber));
        }

        if (!string.IsNullOrWhiteSpace(validated.FirmwareVersion))
        {
            var firmwareVersion = validated.FirmwareVersion.ToLowerInvariant();
            query = query.Where(x => x.FirmwareVersion != null && x.FirmwareVersion.ToLower().Contains(firmwareVersion));
        }

        if (validated.InstallationId.HasValue)
        {
            query = query.Where(x => x.InstallationId == validated.InstallationId.Value);
        }

        if (validated.DeviceTypeId.HasValue)
        {
            query = query.Where(x => x.DeviceTypeId == validated.DeviceTypeId.Value);
        }

        if (validated.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == validated.IsActive.Value);
        }

        if (validated.CreatedAtFrom.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= validated.CreatedAtFrom.Value);
        }

        if (validated.CreatedAtTo.HasValue)
        {
            query = query.Where(x => x.CreatedAt <= validated.CreatedAtTo.Value);
        }

        query = validated.Sort.Field switch
        {
            "code" => validated.Sort.Descending ? query.OrderByDescending(x => x.Code) : query.OrderBy(x => x.Code),
            "name" => validated.Sort.Descending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name),
            "serialNumber" => validated.Sort.Descending ? query.OrderByDescending(x => x.SerialNumber) : query.OrderBy(x => x.SerialNumber),
            "firmwareVersion" => validated.Sort.Descending ? query.OrderByDescending(x => x.FirmwareVersion) : query.OrderBy(x => x.FirmwareVersion),
            "installationName" => validated.Sort.Descending ? query.OrderByDescending(x => x.InstallationName) : query.OrderBy(x => x.InstallationName),
            "deviceTypeName" => validated.Sort.Descending ? query.OrderByDescending(x => x.DeviceTypeName) : query.OrderBy(x => x.DeviceTypeName),
            "lastSeenAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.LastSeenAt) : query.OrderBy(x => x.LastSeenAt),
            "lastAuthenticatedAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.LastAuthenticatedAt) : query.OrderBy(x => x.LastAuthenticatedAt),
            "latestReadingAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.LatestReadingAt) : query.OrderBy(x => x.LatestReadingAt),
            "updatedAt" => validated.Sort.Descending ? query.OrderByDescending(x => x.UpdatedAt) : query.OrderBy(x => x.UpdatedAt),
            "isActive" => validated.Sort.Descending ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
            _ => validated.Sort.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var pageItems = await query
            .Skip((validated.Pagination.Page - 1) * validated.Pagination.PageSize)
            .Take(validated.Pagination.PageSize)
            .ToArrayAsync(cancellationToken);

        var items = pageItems
            .Select(x => new DeviceListItemDto(
                x.Id,
                x.ClientId,
                x.InstallationId,
                x.DeviceTypeId,
                x.Code,
                x.Name,
                x.SerialNumber,
                x.FirmwareVersion,
                x.LastSeenAt,
                x.LastAuthenticatedAt,
                x.IsActive,
                x.HasSecretConfigured,
                x.InstallationName,
                x.DeviceTypeName,
                x.LatestReadingAt,
                x.CreatedAt,
                x.UpdatedAt))
            .ToArray();

        return SearchRequestValidation.ToPagedResult(items, validated.Pagination, totalItems);
    }
}
