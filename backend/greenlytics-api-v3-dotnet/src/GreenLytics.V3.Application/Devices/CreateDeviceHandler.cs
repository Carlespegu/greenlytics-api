using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Devices;

public sealed class CreateDeviceHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly DeviceManagementValidationService _validationService;
    private readonly GetDeviceDetailHandler _getDeviceDetailHandler;

    public CreateDeviceHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        DeviceManagementValidationService validationService,
        GetDeviceDetailHandler getDeviceDetailHandler)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
        _getDeviceDetailHandler = getDeviceDetailHandler;
    }

    public async Task<DeviceDetailDto> HandleAsync(CreateDeviceCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        var device = new Device
        {
            Id = Guid.NewGuid(),
            ClientId = validated.ClientId,
            InstallationId = validated.Installation.Id,
            DeviceTypeId = validated.DeviceType.Id,
            Code = validated.Code,
            Name = validated.Name,
            SerialNumber = validated.SerialNumber,
            FirmwareVersion = validated.FirmwareVersion,
            IsActive = validated.IsActive,
            CreatedAt = now,
            CreatedByUserId = _currentUser.UserId,
        };

        _dbContext.Devices.Add(device);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getDeviceDetailHandler.HandleAsync(validated.ClientId, device.Id, cancellationToken);
    }
}
