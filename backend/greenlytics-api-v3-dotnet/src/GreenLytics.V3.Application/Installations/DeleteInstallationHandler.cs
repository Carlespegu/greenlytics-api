using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Installations;

public sealed class DeleteInstallationHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly InstallationManagementValidationService _validationService;

    public DeleteInstallationHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        InstallationManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task HandleAsync(DeleteInstallationCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateDeleteAsync(command, cancellationToken);
        var now = _clock.UtcNow;

        validated.Installation.IsDeleted = true;
        validated.Installation.DeletedAt = now;
        validated.Installation.DeletedByUserId = _currentUser.UserId;
        validated.Installation.UpdatedAt = now;
        validated.Installation.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
