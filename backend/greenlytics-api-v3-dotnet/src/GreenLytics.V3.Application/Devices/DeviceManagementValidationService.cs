using System.Text.RegularExpressions;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Devices;

public sealed class DeviceManagementValidationService
{
    private static readonly Regex DeviceCodeRegex = new("^[A-Z0-9][A-Z0-9_-]{0,49}$", RegexOptions.Compiled);

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public DeviceManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedDeviceScope> ValidateReadAsync(Guid clientId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanViewDevices(_currentUser);
        await EnsureClientAccessAsync(clientId, "clientId", cancellationToken);

        var device = await LoadDeviceAsync(clientId, deviceId, cancellationToken);
        if (device is null)
        {
            throw new EntityNotFoundException("Device not found for this client.");
        }

        var installation = await LoadInstallationScopeAsync(device.InstallationId, cancellationToken);
        var deviceType = await ValidateDeviceTypeAsync(device.DeviceTypeId, "deviceTypeId", cancellationToken);
        return new ValidatedDeviceScope(device, installation, deviceType);
    }

    public async Task<ValidatedCreateDeviceRequest> ValidateCreateAsync(CreateDeviceCommand command, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanManageDevices(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var code = NormalizeRequiredCode(command.Code);
        var name = RequireText(command.Name, "name", "Device name", 150);
        var serialNumber = NormalizeOptional(command.SerialNumber, "serialNumber", 100);
        var firmwareVersion = NormalizeOptional(command.FirmwareVersion, "firmwareVersion", 100);

        var installation = await ValidateInstallationForClientAsync(command.InstallationId, command.ClientId, "installationId", cancellationToken);
        var deviceType = await ValidateDeviceTypeAsync(command.DeviceTypeId, "deviceTypeId", cancellationToken);

        var duplicateCodeExists = await _dbContext.Devices
            .AnyAsync(x => !x.IsDeleted && x.Code == code, cancellationToken);
        if (duplicateCodeExists)
        {
            throw RequestValidationException.Conflict(
                $"Device with code '{code}' already exists.",
                RequestValidationException.Field("code", "duplicate", $"Device with code '{code}' already exists."));
        }

        if (!string.IsNullOrWhiteSpace(serialNumber))
        {
            var duplicateSerialExists = await _dbContext.Devices
                .AnyAsync(x => !x.IsDeleted && x.SerialNumber == serialNumber, cancellationToken);
            if (duplicateSerialExists)
            {
                throw RequestValidationException.Conflict(
                    $"Device with serial number '{serialNumber}' already exists.",
                    RequestValidationException.Field("serialNumber", "duplicate", $"Device with serial number '{serialNumber}' already exists."));
            }
        }

        return new ValidatedCreateDeviceRequest(
            command.ClientId,
            installation,
            deviceType,
            code,
            name,
            serialNumber,
            firmwareVersion,
            command.IsActive ?? true);
    }

    public async Task<ValidatedUpdateDeviceRequest> ValidateUpdateAsync(UpdateDeviceCommand command, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanManageDevices(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var device = await LoadDeviceAsync(command.ClientId, command.DeviceId, cancellationToken);
        if (device is null)
        {
            throw new EntityNotFoundException("Device not found for this client.");
        }

        var installation = command.InstallationId.HasValue
            ? await ValidateInstallationForClientAsync(command.InstallationId.Value, command.ClientId, "installationId", cancellationToken)
            : await LoadInstallationScopeAsync(device.InstallationId, cancellationToken);

        var deviceType = command.DeviceTypeId.HasValue
            ? await ValidateDeviceTypeAsync(command.DeviceTypeId.Value, "deviceTypeId", cancellationToken)
            : await ValidateDeviceTypeAsync(device.DeviceTypeId, "deviceTypeId", cancellationToken);

        var code = command.Code is null ? null : NormalizeRequiredCode(command.Code);
        var name = command.Name is null ? null : RequireText(command.Name, "name", "Device name", 150);
        var serialNumber = command.SerialNumber is null ? null : NormalizeOptional(command.SerialNumber, "serialNumber", 100);
        var firmwareVersion = command.FirmwareVersion is null ? null : NormalizeOptional(command.FirmwareVersion, "firmwareVersion", 100);

        if (!string.IsNullOrWhiteSpace(code))
        {
            var duplicateCodeExists = await _dbContext.Devices
                .AnyAsync(x => !x.IsDeleted && x.Code == code && x.Id != device.Id, cancellationToken);
            if (duplicateCodeExists)
            {
                throw RequestValidationException.Conflict(
                    $"Device with code '{code}' already exists.",
                    RequestValidationException.Field("code", "duplicate", $"Device with code '{code}' already exists."));
            }
        }

        if (command.SerialNumber is not null && !string.IsNullOrWhiteSpace(serialNumber))
        {
            var duplicateSerialExists = await _dbContext.Devices
                .AnyAsync(x => !x.IsDeleted && x.SerialNumber == serialNumber && x.Id != device.Id, cancellationToken);
            if (duplicateSerialExists)
            {
                throw RequestValidationException.Conflict(
                    $"Device with serial number '{serialNumber}' already exists.",
                    RequestValidationException.Field("serialNumber", "duplicate", $"Device with serial number '{serialNumber}' already exists."));
            }
        }

        return new ValidatedUpdateDeviceRequest(
            device,
            installation,
            deviceType,
            code,
            name,
            serialNumber,
            firmwareVersion,
            command.IsActive);
    }

    public async Task<ValidatedDeviceDeleteRequest> ValidateDeleteAsync(DeleteDeviceCommand command, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanManageDevices(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var device = await LoadDeviceAsync(command.ClientId, command.DeviceId, cancellationToken);
        if (device is null)
        {
            throw new EntityNotFoundException("Device not found for this client.");
        }

        return new ValidatedDeviceDeleteRequest(device);
    }

    public async Task<ValidatedDeviceStatusChange> ValidateStatusChangeAsync(Guid clientId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanManageDevices(_currentUser);
        var validated = await ValidateReadAsync(clientId, deviceId, cancellationToken);
        return new ValidatedDeviceStatusChange(validated.Device);
    }

    public async Task<ValidatedRotateDeviceSecretRequest> ValidateRotateSecretAsync(RotateDeviceSecretCommand command, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanManageDevices(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var device = await LoadDeviceAsync(command.ClientId, command.DeviceId, cancellationToken);
        if (device is null)
        {
            throw new EntityNotFoundException("Device not found for this client.");
        }

        return new ValidatedRotateDeviceSecretRequest(device);
    }

    public async Task<ValidatedDevicesSearchRequest> ValidateSearchAsync(DevicesSearchRequest request, CancellationToken cancellationToken = default)
    {
        DeviceManagementPolicy.RequireCanViewDevices(_currentUser);
        var filters = request.Filters ?? new DeviceSearchFilters(null, null, null, null, null, null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        Guid? effectiveClientId;
        if (DeviceManagementPolicy.IsAdmin(_currentUser))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                await EnsureClientExistsAsync(effectiveClientId.Value, "filters.clientId", cancellationToken);
            }
        }
        else
        {
            var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        if (filters.InstallationId.HasValue)
        {
            if (effectiveClientId.HasValue)
            {
                _ = await ValidateInstallationForClientAsync(filters.InstallationId.Value, effectiveClientId.Value, "filters.installationId", cancellationToken);
            }
            else
            {
                _ = await LoadInstallationScopeByIdAsync(filters.InstallationId.Value, "filters.installationId", cancellationToken);
            }
        }

        if (filters.DeviceTypeId.HasValue)
        {
            _ = await ValidateDeviceTypeAsync(filters.DeviceTypeId.Value, "filters.deviceTypeId", cancellationToken);
        }

        return new ValidatedDevicesSearchRequest(
            effectiveClientId,
            NormalizeCodeOptional(filters.Code),
            NormalizeOptional(filters.Name, "filters.name", 150),
            NormalizeOptional(filters.SerialNumber, "filters.serialNumber", 100),
            NormalizeOptional(filters.FirmwareVersion, "filters.firmwareVersion", 100),
            filters.InstallationId,
            filters.DeviceTypeId,
            filters.IsActive,
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(
                request.Sort,
                "createdAt",
                "code",
                "name",
                "serialNumber",
                "firmwareVersion",
                "installationName",
                "deviceTypeName",
                "lastSeenAt",
                "lastAuthenticatedAt",
                "latestReadingAt",
                "updatedAt",
                "isActive"));
    }

    private async Task EnsureClientAccessAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        if (DeviceManagementPolicy.IsAdmin(_currentUser))
        {
            await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
            return;
        }

        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        if (clientId != currentClientId)
        {
            throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
        }

        await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
    }

    private async Task EnsureClientExistsAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Clients
            .AsNoTracking()
            .AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested client does not exist."));
        }
    }

    private async Task<InstallationScope> ValidateInstallationForClientAsync(Guid installationId, Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var installation = await _dbContext.Installations
            .AsNoTracking()
            .Where(x => x.Id == installationId && x.ClientId == clientId && !x.IsDeleted)
            .Select(x => new InstallationScope(x.Id, x.ClientId, x.Code, x.Name))
            .SingleOrDefaultAsync(cancellationToken);

        if (installation is null)
        {
            throw new EntityNotFoundException("Installation not found for this client.");
        }

        return installation;
    }

    private async Task<InstallationScope> LoadInstallationScopeAsync(Guid installationId, CancellationToken cancellationToken)
        => await _dbContext.Installations
            .AsNoTracking()
            .Where(x => x.Id == installationId && !x.IsDeleted)
            .Select(x => new InstallationScope(x.Id, x.ClientId, x.Code, x.Name))
            .SingleAsync(cancellationToken);

    private async Task<InstallationScope> LoadInstallationScopeByIdAsync(Guid installationId, string fieldName, CancellationToken cancellationToken)
    {
        var installation = await _dbContext.Installations
            .AsNoTracking()
            .Where(x => x.Id == installationId && !x.IsDeleted)
            .Select(x => new InstallationScope(x.Id, x.ClientId, x.Code, x.Name))
            .SingleOrDefaultAsync(cancellationToken);

        if (installation is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested installation does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested installation does not exist."));
        }

        return installation;
    }

    private async Task<TypeCatalog> ValidateDeviceTypeAsync(Guid deviceTypeId, string fieldName, CancellationToken cancellationToken)
    {
        var deviceType = await _dbContext.Types
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == deviceTypeId
                    && x.Category == "DeviceType"
                    && !x.IsDeleted
                    && x.IsActive,
                cancellationToken);

        if (deviceType is null)
        {
            throw RequestValidationException.BadRequest(
                "Invalid device type.",
                RequestValidationException.Field(fieldName, "not_found", "Invalid device type."));
        }

        return deviceType;
    }

    private Task<Device?> LoadDeviceAsync(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
        => _dbContext.Devices
            .SingleOrDefaultAsync(
                x => x.Id == deviceId
                    && x.ClientId == clientId
                    && !x.IsDeleted,
                cancellationToken);

    private static string RequireText(string input, string fieldKey, string fieldLabel, int maxLength)
    {
        var normalized = NormalizeOptional(input, fieldKey, maxLength);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                $"{fieldLabel} is required.",
                RequestValidationException.Field(fieldKey, "required", $"{fieldLabel} is required."));
        }

        return normalized;
    }

    private static string NormalizeRequiredCode(string input)
    {
        var normalized = NormalizeCodeOptional(input);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Device code is required.",
                RequestValidationException.Field("code", "required", "Device code is required."));
        }

        return normalized;
    }

    private static string? NormalizeCodeOptional(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = Regex.Replace(input.Trim().ToUpperInvariant(), "\\s+", "-");
        if (!DeviceCodeRegex.IsMatch(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Device code contains unsupported characters. Use only letters, numbers, hyphen and underscore.",
                RequestValidationException.Field("code", "invalid_format", "Device code contains unsupported characters. Use only letters, numbers, hyphen and underscore."));
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? input, string fieldKey, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = input.Trim();
        if (normalized.Length > maxLength)
        {
            throw RequestValidationException.BadRequest(
                $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters.",
                RequestValidationException.Field(fieldKey, "max_length", $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters."));
        }

        return normalized;
    }
}

public sealed record InstallationScope(
    Guid Id,
    Guid ClientId,
    string Code,
    string Name
);

public sealed record ValidatedDeviceScope(
    Device Device,
    InstallationScope Installation,
    TypeCatalog DeviceType
);

public sealed record ValidatedCreateDeviceRequest(
    Guid ClientId,
    InstallationScope Installation,
    TypeCatalog DeviceType,
    string Code,
    string Name,
    string? SerialNumber,
    string? FirmwareVersion,
    bool IsActive
);

public sealed record ValidatedUpdateDeviceRequest(
    Device Device,
    InstallationScope Installation,
    TypeCatalog DeviceType,
    string? Code,
    string? Name,
    string? SerialNumber,
    string? FirmwareVersion,
    bool? IsActive
);

public sealed record ValidatedDeviceDeleteRequest(
    Device Device
);

public sealed record ValidatedDeviceStatusChange(
    Device Device
);

public sealed record ValidatedRotateDeviceSecretRequest(
    Device Device
);

public sealed record ValidatedDevicesSearchRequest(
    Guid? EffectiveClientId,
    string? Code,
    string? Name,
    string? SerialNumber,
    string? FirmwareVersion,
    Guid? InstallationId,
    Guid? DeviceTypeId,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);
