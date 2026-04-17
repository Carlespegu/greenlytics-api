using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Installations;

public sealed class CreateInstallationHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly GetInstallationDetailHandler _getInstallationDetailHandler;
    private readonly InstallationManagementValidationService _validationService;

    public CreateInstallationHandler(
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

    public async Task<InstallationDetailDto> HandleAsync(CreateInstallationCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);

        var installation = new Domain.Entities.Installation
        {
            Id = Guid.NewGuid(),
            ClientId = validated.ClientId,
            Code = validated.Code,
            Name = validated.Name,
            Description = validated.Description,
            Location = validated.Location,
            IsActive = validated.IsActive,
            CreatedAt = _clock.UtcNow,
            CreatedByUserId = _currentUser.UserId,
        };

        _dbContext.Installations.Add(installation);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _getInstallationDetailHandler.HandleAsync(validated.ClientId, installation.Id, cancellationToken);
    }
}
