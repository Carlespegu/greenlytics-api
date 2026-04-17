using GreenLytics.V3.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Alerts;

public sealed class GetAlertDetailHandler
{
    private readonly IAppDbContext _dbContext;
    private readonly AlertManagementValidationService _validationService;

    public GetAlertDetailHandler(IAppDbContext dbContext, AlertManagementValidationService validationService)
    {
        _dbContext = dbContext;
        _validationService = validationService;
    }

    public async Task<AlertDto> HandleAsync(Guid alertId, CancellationToken cancellationToken = default)
    {
        await _validationService.ValidateReadAsync(alertId, cancellationToken);

        var item = await BuildQuery()
            .SingleAsync(x => x.Id == alertId, cancellationToken);

        return item.ToDto();
    }

    internal IQueryable<AlertReadModel> BuildQuery()
        => from alert in _dbContext.Alerts.AsNoTracking()
           join client in _dbContext.Clients.AsNoTracking() on alert.ClientId equals client.Id
           join readingType in _dbContext.ReadingTypes.AsNoTracking() on alert.ReadingTypeId equals readingType.Id
           join installation in _dbContext.Installations.AsNoTracking().Where(x => !x.IsDeleted)
               on alert.InstallationId equals installation.Id into installationGroup
           from installation in installationGroup.DefaultIfEmpty()
           join plant in _dbContext.Plants.AsNoTracking().Where(x => !x.IsDeleted)
               on alert.PlantId equals plant.Id into plantGroup
           from plant in plantGroup.DefaultIfEmpty()
           where !alert.IsDeleted && !client.IsDeleted
           select new AlertReadModel(
               alert.Id,
               alert.ClientId,
               client.Code,
               client.Name,
               alert.InstallationId,
               installation != null ? installation.Code : null,
               installation != null ? installation.Name : null,
               alert.PlantId,
               plant != null ? plant.Code : null,
               plant != null ? plant.Name : null,
               alert.ReadingTypeId,
               readingType.Code,
               readingType.Name,
               readingType.ValueType,
               alert.Name,
               alert.Description,
               alert.Channel,
               alert.RecipientEmail,
               alert.ConditionType,
               alert.ValueType,
               alert.MinValue,
               alert.MaxValue,
               alert.ExactNumericValue,
               alert.ExactTextValue,
               alert.ExactBooleanValue,
               alert.IsActive,
               alert.CreatedAt,
               alert.CreatedByUserId,
               alert.UpdatedAt,
               alert.UpdatedByUserId);
}
