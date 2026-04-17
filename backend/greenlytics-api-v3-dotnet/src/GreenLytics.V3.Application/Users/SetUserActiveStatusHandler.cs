using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Users;

public sealed class SetUserActiveStatusHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly UserManagementValidationService _validationService;

    public SetUserActiveStatusHandler(
        IAppDbContext dbContext,
        ICurrentUserAccessor currentUser,
        IClock clock,
        UserManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _clock = clock;
        _validationService = validationService;
    }

    public async Task<UserDto> HandleAsync(Guid userId, bool isActive, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateStatusChangeAsync(userId, cancellationToken);
        var actorUserId = _currentUser.UserId;

        validated.User.IsActive = isActive;
        validated.User.UpdatedAt = _clock.UtcNow;
        validated.User.UpdatedByUserId = actorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return validated.User.ToDto();
    }
}
