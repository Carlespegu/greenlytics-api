using GreenLytics.V3.Application.Abstractions;

namespace GreenLytics.V3.Application.Alerts;

public sealed class UpdateAlertHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly AlertManagementValidationService _validationService;
    private readonly GetAlertDetailHandler _detailHandler;

    public UpdateAlertHandler(
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

    public async Task<AlertDto> HandleAsync(UpdateAlertCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateUpdateAsync(command, cancellationToken);

        validated.Alert.ClientId = validated.ClientId;
        validated.Alert.InstallationId = validated.InstallationId;
        validated.Alert.PlantId = validated.PlantId;
        validated.Alert.ReadingTypeId = validated.ReadingType.Id;
        validated.Alert.Name = validated.Name;
        validated.Alert.Description = validated.Description;
        validated.Alert.Channel = validated.Channel;
        validated.Alert.RecipientEmail = validated.RecipientEmail;
        validated.Alert.ConditionType = validated.ConditionType;
        validated.Alert.ValueType = validated.ReadingType.ValueType.Trim().ToUpperInvariant();
        validated.Alert.MinValue = validated.MinValue;
        validated.Alert.MaxValue = validated.MaxValue;
        validated.Alert.ExactNumericValue = validated.ExactNumericValue;
        validated.Alert.ExactTextValue = validated.ExactTextValue;
        validated.Alert.ExactBooleanValue = validated.ExactBooleanValue;
        validated.Alert.IsActive = validated.IsActive;
        validated.Alert.UpdatedAt = _clock.UtcNow;
        validated.Alert.UpdatedByUserId = _currentUser.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _detailHandler.HandleAsync(validated.Alert.Id, cancellationToken);
    }
}
