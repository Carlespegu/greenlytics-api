using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Devices;

public sealed class RotateDeviceSecretHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly IDeviceSecretService _deviceSecretService;
    private readonly DeviceManagementValidationService _validationService;

    public RotateDeviceSecretHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        IDeviceSecretService deviceSecretService,
        DeviceManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _deviceSecretService = deviceSecretService;
        _validationService = validationService;
    }

    public async Task<DeviceSecretResult> HandleAsync(RotateDeviceSecretCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateRotateSecretAsync(command, cancellationToken);
        var rawSecret = _deviceSecretService.GenerateSecret();
        var now = _clock.UtcNow;

        validated.Device.DeviceSecretHash = _deviceSecretService.HashSecret(rawSecret);
        validated.Device.SecretRotatedAt = now;
        validated.Device.UpdatedAt = now;
        validated.Device.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return new DeviceSecretResult(validated.Device.Id, validated.Device.Code, rawSecret, now);
    }
}

public sealed record DeviceSecretResult(
    Guid DeviceId,
    string DeviceCode,
    string DeviceSecret,
    DateTime SecretRotatedAt
);
