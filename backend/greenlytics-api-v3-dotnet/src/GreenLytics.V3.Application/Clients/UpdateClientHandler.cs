using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Clients;

public sealed class UpdateClientHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly ClientManagementValidationService _validationService;

    public UpdateClientHandler(
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

    public async Task<ClientDto> HandleAsync(UpdateClientCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);
        var actorUserId = _currentUser.UserId;

        validated.Client.Code = validated.Code;
        validated.Client.Name = validated.Name;
        validated.Client.Description = validated.Description;
        validated.Client.IsActive = validated.IsActive;
        validated.Client.UpdatedAt = _clock.UtcNow;
        validated.Client.UpdatedByUserId = actorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return validated.Client.ToDto();
    }
}
