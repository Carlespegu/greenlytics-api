using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Clients;

public sealed class SetClientActiveStatusHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly ClientManagementValidationService _validationService;

    public SetClientActiveStatusHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        ClientManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task<ClientDto> HandleAsync(Guid clientId, bool isActive, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(clientId, cancellationToken);
        var actorUserId = _currentUser.UserId;

        validated.Client.IsActive = isActive;
        validated.Client.UpdatedAt = _clock.UtcNow;
        validated.Client.UpdatedByUserId = actorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return validated.Client.ToDto();
    }
}
