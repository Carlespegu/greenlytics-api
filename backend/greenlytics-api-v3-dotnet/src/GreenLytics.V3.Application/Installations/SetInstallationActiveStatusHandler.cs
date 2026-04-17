using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Installations;

public sealed class SetInstallationActiveStatusHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly GetInstallationDetailHandler _getInstallationDetailHandler;
    private readonly InstallationManagementValidationService _validationService;

    public SetInstallationActiveStatusHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        GetInstallationDetailHandler getInstallationDetailHandler,
        InstallationManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _getInstallationDetailHandler = getInstallationDetailHandler;
        _validationService = validationService;
    }

    public async Task<InstallationDetailDto> HandleAsync(Guid clientId, Guid installationId, bool isActive, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(clientId, installationId, cancellationToken);

        validated.Installation.IsActive = isActive;
        validated.Installation.UpdatedAt = _clock.UtcNow;
        validated.Installation.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getInstallationDetailHandler.HandleAsync(clientId, installationId, cancellationToken);
    }
}
