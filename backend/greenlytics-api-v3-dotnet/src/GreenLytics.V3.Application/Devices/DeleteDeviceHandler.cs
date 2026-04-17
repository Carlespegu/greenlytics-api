using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Devices;

public sealed class DeleteDeviceHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly DeviceManagementValidationService _validationService;

    public DeleteDeviceHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        DeviceManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task HandleAsync(DeleteDeviceCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateDeleteAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        validated.Device.IsDeleted = true;
        validated.Device.DeletedAt = now;
        validated.Device.DeletedByUserId = _currentUser.UserId;
        validated.Device.UpdatedAt = now;
        validated.Device.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
