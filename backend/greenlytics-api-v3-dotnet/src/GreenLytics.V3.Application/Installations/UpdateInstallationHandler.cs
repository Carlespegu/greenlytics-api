using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Installations;

public sealed class UpdateInstallationHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly GetInstallationDetailHandler _getInstallationDetailHandler;
    private readonly InstallationManagementValidationService _validationService;

    public UpdateInstallationHandler(
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

    public async Task<InstallationDetailDto> HandleAsync(UpdateInstallationCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);

        if (validated.Code is not null)
        {
            validated.Installation.Code = validated.Code;
        }

        if (validated.Name is not null)
        {
            validated.Installation.Name = validated.Name;
        }

        if (command.Description is not null)
        {
            validated.Installation.Description = validated.Description;
        }

        if (command.Location is not null)
        {
            validated.Installation.Location = validated.Location;
        }

        if (validated.IsActive.HasValue)
        {
            validated.Installation.IsActive = validated.IsActive.Value;
        }

        validated.Installation.UpdatedAt = _clock.UtcNow;
        validated.Installation.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getInstallationDetailHandler.HandleAsync(command.ClientId, validated.Installation.Id, cancellationToken);
    }
}
