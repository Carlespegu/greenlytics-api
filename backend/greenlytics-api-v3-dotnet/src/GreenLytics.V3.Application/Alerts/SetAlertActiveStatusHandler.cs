using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Alerts;

public sealed class SetAlertActiveStatusHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly AlertManagementValidationService _validationService;
    private readonly GetAlertDetailHandler _detailHandler;

    public SetAlertActiveStatusHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        AlertManagementValidationService validationService,
        GetAlertDetailHandler detailHandler)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
        _detailHandler = detailHandler;
    }

    public async Task<AlertDto> HandleAsync(Guid alertId, bool isActive, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(alertId, cancellationToken);
        validated.Alert.IsActive = isActive;
        validated.Alert.UpdatedAt = _clock.UtcNow;
        validated.Alert.UpdatedByUserId = _currentUser.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _detailHandler.HandleAsync(alertId, cancellationToken);
    }
}
