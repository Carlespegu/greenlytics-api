namespace GreenLytics.V3.Application.Users;

public sealed class GetUserDetailHandler
{
    private readonly UserManagementValidationService _validationService;

    public GetUserDetailHandler(UserManagementValidationService validationService)
    {
        _validationService = validationService;
    }

    public async Task<UserDto> HandleAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateReadAsync(userId, cancellationToken);
        return validated.User.ToDto();
    }
}
