using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Alerts;

public sealed class CreateAlertHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IClock _clock;
    private readonly AlertManagementValidationService _validationService;
    private readonly GetAlertDetailHandler _detailHandler;

    public CreateAlertHandler(
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

    public async Task<AlertDto> HandleAsync(CreateAlertCommand command, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateCreateAsync(command, cancellationToken);

        var actor = _currentUser.UserId;
        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            ClientId = validated.ClientId,
            InstallationId = validated.InstallationId,
            PlantId = validated.PlantId,
            ReadingTypeId = validated.ReadingType.Id,
            Name = validated.Name,
            Description = validated.Description,
            Channel = validated.Channel,
            RecipientEmail = validated.RecipientEmail,
            ConditionType = validated.ConditionType,
            ValueType = validated.ReadingType.ValueType.Trim().ToUpperInvariant(),
            MinValue = validated.MinValue,
            MaxValue = validated.MaxValue,
            ExactNumericValue = validated.ExactNumericValue,
            ExactTextValue = validated.ExactTextValue,
            ExactBooleanValue = validated.ExactBooleanValue,
            IsActive = validated.IsActive,
            CreatedAt = _clock.UtcNow,
            CreatedByUserId = actor,
        };

        _dbContext.Alerts.Add(alert);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _detailHandler.HandleAsync(alert.Id, cancellationToken);
    }
}
