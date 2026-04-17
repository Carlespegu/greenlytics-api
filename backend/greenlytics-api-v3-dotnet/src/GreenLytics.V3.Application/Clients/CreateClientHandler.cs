using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Clients;

public sealed class CreateClientHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly ClientManagementValidationService _validationService;

    public CreateClientHandler(
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

    public async Task<ClientDto> HandleAsync(CreateClientCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);
        var actorUserId = _currentUser.UserId;

        var client = new Domain.Entities.Client
        {
            Id = Guid.NewGuid(),
            Code = validated.Code,
            Name = validated.Name,
            Description = validated.Description,
            IsActive = validated.IsActive,
            CreatedAt = _clock.UtcNow,
            CreatedByUserId = actorUserId,
        };

        _dbContext.Clients.Add(client);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return client.ToDto();
    }
}
