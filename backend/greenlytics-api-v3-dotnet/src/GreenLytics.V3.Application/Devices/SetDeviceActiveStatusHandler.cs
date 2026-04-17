using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Devices;

public sealed class SetDeviceActiveStatusHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly GetDeviceDetailHandler _getDeviceDetailHandler;
    private readonly DeviceManagementValidationService _validationService;

    public SetDeviceActiveStatusHandler(
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

    public async Task<DeviceDetailDto> HandleAsync(Guid clientId, Guid deviceId, bool isActive, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(clientId, deviceId, cancellationToken);
        validated.Device.IsActive = isActive;
        validated.Device.UpdatedAt = _clock.UtcNow;
        validated.Device.UpdatedByUserId = _currentUser.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getDeviceDetailHandler.HandleAsync(clientId, deviceId, cancellationToken);
    }
}
