using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Devices;

public sealed class UpdateDeviceHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly GetDeviceDetailHandler _getDeviceDetailHandler;
    private readonly DeviceManagementValidationService _validationService;

    public UpdateDeviceHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        GetDeviceDetailHandler getDeviceDetailHandler,
        DeviceManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _getDeviceDetailHandler = getDeviceDetailHandler;
        _validationService = validationService;
    }

    public async Task<DeviceDetailDto> HandleAsync(UpdateDeviceCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);

        if (command.InstallationId.HasValue)
        {
            validated.Device.InstallationId = validated.Installation.Id;
            validated.Device.ClientId = validated.Installation.ClientId;
        }

        if (command.DeviceTypeId.HasValue)
        {
            validated.Device.DeviceTypeId = validated.DeviceType.Id;
        }

        if (validated.Code is not null)
        {
            validated.Device.Code = validated.Code;
        }

        if (validated.Name is not null)
        {
            validated.Device.Name = validated.Name;
        }

        if (command.SerialNumber is not null)
        {
            validated.Device.SerialNumber = validated.SerialNumber;
        }

        if (command.FirmwareVersion is not null)
        {
            validated.Device.FirmwareVersion = validated.FirmwareVersion;
        }

        if (validated.IsActive.HasValue)
        {
            validated.Device.IsActive = validated.IsActive.Value;
        }

        validated.Device.UpdatedAt = _clock.UtcNow;
        validated.Device.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getDeviceDetailHandler.HandleAsync(command.ClientId, validated.Device.Id, cancellationToken);
    }
}
