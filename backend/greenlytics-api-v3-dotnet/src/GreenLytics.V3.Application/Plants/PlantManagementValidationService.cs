using System.Text.RegularExpressions;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Plants;

public sealed class PlantManagementValidationService
{
    private static readonly Regex PlantCodeRegex = new("^[A-Z0-9][A-Z0-9_-]{0,49}$", RegexOptions.Compiled);

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public PlantManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedPlantScope> ValidateReadAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanViewPlants(_currentUser);
        await EnsureClientAccessAsync(clientId, "clientId", cancellationToken);

        var plant = await LoadPlantAsync(clientId, plantId, cancellationToken);
        if (plant is null)
        {
            throw new EntityNotFoundException("Plant not found for this client.");
        }

        return new ValidatedPlantScope(plant);
    }

    public async Task<ValidatedCreatePlantRequest> ValidateCreateAsync(CreatePlantCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var installation = await ValidateInstallationAsync(command.InstallationId, command.ClientId, "installationId", cancellationToken);
        var code = NormalizeRequiredCode(command.Code);
        var name = RequireText(command.Name, "name", "Plant name", 150);
        var description = NormalizeOptional(command.Description, "description", 2000);
        var plantType = await ValidateTypeAsync(command.PlantTypeId, "PlantType", "plantTypeId", "Invalid plant type.", cancellationToken);
        var plantStatus = await ValidateTypeAsync(command.PlantStatusId, "PlantStatus", "plantStatusId", "Invalid plant status.", cancellationToken);

        var duplicateCodeExists = await _dbContext.Plants
            .AnyAsync(x => !x.IsDeleted && x.ClientId == command.ClientId && x.Code == code, cancellationToken);
        if (duplicateCodeExists)
        {
            throw RequestValidationException.Conflict(
                $"Plant with code '{code}' already exists for this client.",
                RequestValidationException.Field("code", "duplicate", $"Plant with code '{code}' already exists for this client."));
        }

        return new ValidatedCreatePlantRequest(
            command.ClientId,
            installation,
            code,
            name,
            description,
            plantType?.Id,
            plantStatus?.Id,
            NormalizeFloweringMonths(command.FloweringMonths),
            NormalizeFertilizationSeasons(command.FertilizationSeasons),
            command.IsActive ?? true);
    }

    public async Task<ValidatedUpdatePlantRequest> ValidateUpdateAsync(UpdatePlantCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var plant = await LoadPlantAsync(command.ClientId, command.PlantId, cancellationToken);
        if (plant is null)
        {
            throw new EntityNotFoundException("Plant not found for this client.");
        }

        var installation = command.InstallationId.HasValue
            ? await ValidateInstallationAsync(command.InstallationId.Value, command.ClientId, "installationId", cancellationToken)
            : null;

        var code = command.Code is null ? null : NormalizeRequiredCode(command.Code);
        var name = command.Name is null ? null : RequireText(command.Name, "name", "Plant name", 150);
        var description = command.Description is null ? null : NormalizeOptional(command.Description, "description", 2000);
        var plantType = command.PlantTypeId.HasValue
            ? await ValidateTypeAsync(command.PlantTypeId, "PlantType", "plantTypeId", "Invalid plant type.", cancellationToken)
            : null;
        var plantStatus = command.PlantStatusId.HasValue
            ? await ValidateTypeAsync(command.PlantStatusId, "PlantStatus", "plantStatusId", "Invalid plant status.", cancellationToken)
            : null;

        if (!string.IsNullOrWhiteSpace(code))
        {
            var duplicateCodeExists = await _dbContext.Plants
                .AnyAsync(x => !x.IsDeleted && x.ClientId == command.ClientId && x.Code == code && x.Id != plant.Id, cancellationToken);
            if (duplicateCodeExists)
            {
                throw RequestValidationException.Conflict(
                    $"Plant with code '{code}' already exists for this client.",
                    RequestValidationException.Field("code", "duplicate", $"Plant with code '{code}' already exists for this client."));
            }
        }

        return new ValidatedUpdatePlantRequest(
            plant,
            installation,
            code,
            name,
            description,
            command.PlantTypeId.HasValue ? plantType?.Id : null,
            command.PlantStatusId.HasValue ? plantStatus?.Id : null,
            command.FloweringMonths is null ? null : NormalizeFloweringMonths(command.FloweringMonths),
            command.FertilizationSeasons is null ? null : NormalizeFertilizationSeasons(command.FertilizationSeasons),
            command.IsActive);
    }

    public async Task<ValidatedPlantDeleteRequest> ValidateDeleteAsync(DeletePlantCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        await EnsureClientAccessAsync(command.ClientId, "clientId", cancellationToken);

        var plant = await LoadPlantAsync(command.ClientId, command.PlantId, cancellationToken);
        if (plant is null)
        {
            throw new EntityNotFoundException("Plant not found for this client.");
        }

        return new ValidatedPlantDeleteRequest(plant);
    }

    public async Task<ValidatedPlantAnalysisRequest> ValidateAnalyzePhotosAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        await EnsureClientAccessAsync(clientId, "clientId", cancellationToken);
        return new ValidatedPlantAnalysisRequest(clientId);
    }

    public async Task<ValidatedPlantsSearchRequest> ValidateSearchAsync(PlantsSearchRequest request, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanViewPlants(_currentUser);
        var filters = request.Filters ?? new PlantSearchFilters(null, null, null, null, null, null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        Guid? effectiveClientId;
        if (CurrentUserAuthorization.IsInAnyRole(_currentUser, RoleCodes.Admin))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                await EnsureClientExistsAsync(effectiveClientId.Value, "filters.clientId", cancellationToken);
            }
        }
        else
        {
            var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        if (filters.InstallationId.HasValue)
        {
            if (effectiveClientId.HasValue)
            {
                _ = await ValidateInstallationAsync(filters.InstallationId.Value, effectiveClientId.Value, "filters.installationId", cancellationToken);
            }
            else
            {
                await EnsureInstallationExistsAsync(filters.InstallationId.Value, "filters.installationId", cancellationToken);
            }
        }

        if (filters.PlantTypeId.HasValue)
        {
            _ = await ValidateTypeAsync(filters.PlantTypeId, "PlantType", "filters.plantTypeId", "Invalid plant type.", cancellationToken);
        }

        if (filters.PlantStatusId.HasValue)
        {
            _ = await ValidateTypeAsync(filters.PlantStatusId, "PlantStatus", "filters.plantStatusId", "Invalid plant status.", cancellationToken);
        }

        return new ValidatedPlantsSearchRequest(
            effectiveClientId,
            NormalizeCodeOptional(filters.Code),
            NormalizeOptional(filters.Name, "filters.name", 150),
            NormalizeOptional(filters.Description, "filters.description", 2000),
            filters.InstallationId,
            filters.PlantTypeId,
            filters.PlantStatusId,
            filters.IsActive,
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(
                request.Sort,
                "createdAt",
                "code",
                "name",
                "description",
                "installationName",
                "plantTypeName",
                "plantStatusName",
                "thresholdsCount",
                "eventsCount",
                "updatedAt",
                "isActive"));
    }

    public async Task<ValidatedPlantPhotoRequest> ValidatePhotoListAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        return new ValidatedPlantPhotoRequest(scope.Plant);
    }

    public async Task<ValidatedCreatePlantPhotoRequest> ValidateCreatePhotoAsync(CreatePlantPhotoCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        var scope = await ValidateReadAsync(command.ClientId, command.PlantId, cancellationToken);
        var photoType = await ValidateTypeAsync(command.PhotoTypeId, "PhotoType", "photoTypeId", "Invalid photo type.", cancellationToken);
        var fileName = RequireText(command.FileName, "fileName", "Photo file name", 500);
        var fileUrl = RequireText(command.FileUrl, "fileUrl", "Photo file url", 2000);

        return new ValidatedCreatePlantPhotoRequest(scope.Plant, photoType?.Id, fileName, fileUrl, command.IsPrimary, command.IsActive ?? true);
    }

    public async Task<ValidatedPhotoScope> ValidatePhotoScopeAsync(Guid clientId, Guid plantId, Guid photoId, bool requireManagePermission, CancellationToken cancellationToken = default)
    {
        if (requireManagePermission)
        {
            CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        }
        else
        {
            CurrentUserAuthorization.RequireCanViewPlants(_currentUser);
        }

        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        var photo = await _dbContext.Photos
            .SingleOrDefaultAsync(x => x.Id == photoId && x.PlantId == plantId && !x.IsDeleted, cancellationToken);
        if (photo is null)
        {
            throw new EntityNotFoundException("Photo not found for this plant.");
        }

        return new ValidatedPhotoScope(scope.Plant, photo);
    }

    public async Task<ValidatedPlantThresholdRequest> ValidateThresholdListAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        return new ValidatedPlantThresholdRequest(scope.Plant);
    }

    public async Task<ValidatedCreatePlantThresholdRequest> ValidateCreateThresholdAsync(CreatePlantThresholdCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        var scope = await ValidateReadAsync(command.ClientId, command.PlantId, cancellationToken);
        var readingType = await ValidateTypeAsync(command.ReadingTypeId, "ReadingType", "readingTypeId", "Invalid reading type.", cancellationToken)
            ?? throw new InvalidOperationException("Reading type validation returned null.");
        var unitType = await ValidateTypeAsync(command.UnitTypeId, "UnitType", "unitTypeId", "Invalid unit type.", cancellationToken);
        ValidateThresholdRange(command.MinValue, command.MaxValue);

        var duplicateExists = await _dbContext.PlantThresholds
            .AnyAsync(x => !x.IsDeleted && x.PlantId == scope.Plant.Id && x.ReadingTypeId == readingType.Id, cancellationToken);
        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                "Duplicate active threshold for same reading type.",
                RequestValidationException.Field("readingTypeId", "duplicate", "Duplicate active threshold for same reading type."));
        }

        return new ValidatedCreatePlantThresholdRequest(scope.Plant, readingType.Id, unitType?.Id, command.MinValue, command.MaxValue, command.OptimalValue, command.IsActive ?? true);
    }

    public async Task<ValidatedThresholdScope> ValidateThresholdScopeAsync(Guid clientId, Guid plantId, Guid thresholdId, bool requireManagePermission, CancellationToken cancellationToken = default)
    {
        if (requireManagePermission)
        {
            CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        }
        else
        {
            CurrentUserAuthorization.RequireCanViewPlants(_currentUser);
        }

        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        var threshold = await _dbContext.PlantThresholds
            .SingleOrDefaultAsync(x => x.Id == thresholdId && x.PlantId == plantId && !x.IsDeleted, cancellationToken);
        if (threshold is null)
        {
            throw new EntityNotFoundException("Threshold not found for this plant.");
        }

        return new ValidatedThresholdScope(scope.Plant, threshold);
    }

    public async Task<ValidatedUpdatePlantThresholdRequest> ValidateUpdateThresholdAsync(UpdatePlantThresholdCommand command, CancellationToken cancellationToken = default)
    {
        var scope = await ValidateThresholdScopeAsync(command.ClientId, command.PlantId, command.ThresholdId, true, cancellationToken);
        var readingTypeId = command.ReadingTypeId ?? scope.Threshold.ReadingTypeId;
        var unitType = command.UnitTypeId.HasValue
            ? await ValidateTypeAsync(command.UnitTypeId, "UnitType", "unitTypeId", "Invalid unit type.", cancellationToken)
            : null;

        if (command.ReadingTypeId.HasValue)
        {
            _ = await ValidateTypeAsync(command.ReadingTypeId, "ReadingType", "readingTypeId", "Invalid reading type.", cancellationToken);
            var duplicateExists = await _dbContext.PlantThresholds
                .AnyAsync(x => !x.IsDeleted && x.PlantId == command.PlantId && x.ReadingTypeId == readingTypeId && x.Id != command.ThresholdId, cancellationToken);
            if (duplicateExists)
            {
                throw RequestValidationException.Conflict(
                    "Duplicate active threshold for same reading type.",
                    RequestValidationException.Field("readingTypeId", "duplicate", "Duplicate active threshold for same reading type."));
            }
        }

        ValidateThresholdRange(command.MinValue ?? scope.Threshold.MinValue, command.MaxValue ?? scope.Threshold.MaxValue);

        return new ValidatedUpdatePlantThresholdRequest(
            scope.Plant,
            scope.Threshold,
            readingTypeId,
            command.UnitTypeId.HasValue ? unitType?.Id : null,
            command.MinValue,
            command.MaxValue,
            command.OptimalValue,
            command.IsActive);
    }

    public async Task<ValidatedPlantEventRequest> ValidateEventListAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken = default)
    {
        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        return new ValidatedPlantEventRequest(scope.Plant);
    }

    public async Task<ValidatedCreatePlantEventRequest> ValidateCreateEventAsync(CreatePlantEventCommand command, CancellationToken cancellationToken = default)
    {
        CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        var scope = await ValidateReadAsync(command.ClientId, command.PlantId, cancellationToken);
        var eventType = await ValidateTypeAsync(command.EventTypeId, "PlantEventType", "eventTypeId", "Invalid plant event type.", cancellationToken)
            ?? throw new InvalidOperationException("Plant event type validation returned null.");
        var title = RequireText(command.Title, "title", "Event title", 200);
        var description = NormalizeOptional(command.Description, "description", 2000);
        var notes = NormalizeOptional(command.Notes, "notes", 4000);
        if (command.EventDate == default)
        {
            throw RequestValidationException.BadRequest(
                "Event date is required.",
                RequestValidationException.Field("eventDate", "required", "Event date is required."));
        }

        return new ValidatedCreatePlantEventRequest(scope.Plant, eventType.Id, title, description, notes, command.EventDate.ToUniversalTime(), command.IsActive ?? true);
    }

    public async Task<ValidatedEventScope> ValidateEventScopeAsync(Guid clientId, Guid plantId, Guid eventId, bool requireManagePermission, CancellationToken cancellationToken = default)
    {
        if (requireManagePermission)
        {
            CurrentUserAuthorization.RequireCanManagePlants(_currentUser);
        }
        else
        {
            CurrentUserAuthorization.RequireCanViewPlants(_currentUser);
        }

        var scope = await ValidateReadAsync(clientId, plantId, cancellationToken);
        var plantEvent = await _dbContext.PlantEvents
            .SingleOrDefaultAsync(x => x.Id == eventId && x.PlantId == plantId && !x.IsDeleted, cancellationToken);
        if (plantEvent is null)
        {
            throw new EntityNotFoundException("Event not found for this plant.");
        }

        return new ValidatedEventScope(scope.Plant, plantEvent);
    }

    public async Task<ValidatedUpdatePlantEventRequest> ValidateUpdateEventAsync(UpdatePlantEventCommand command, CancellationToken cancellationToken = default)
    {
        var scope = await ValidateEventScopeAsync(command.ClientId, command.PlantId, command.EventId, true, cancellationToken);
        var eventType = command.EventTypeId.HasValue
            ? await ValidateTypeAsync(command.EventTypeId, "PlantEventType", "eventTypeId", "Invalid plant event type.", cancellationToken)
            : null;

        return new ValidatedUpdatePlantEventRequest(
            scope.Plant,
            scope.Event,
            command.EventTypeId.HasValue ? eventType?.Id : null,
            command.Title is null ? null : RequireText(command.Title, "title", "Event title", 200),
            command.Description is null ? null : NormalizeOptional(command.Description, "description", 2000),
            command.Notes is null ? null : NormalizeOptional(command.Notes, "notes", 4000),
            command.EventDate?.ToUniversalTime(),
            command.IsActive);
    }

    private async Task EnsureClientAccessAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        if (CurrentUserAuthorization.IsInAnyRole(_currentUser, RoleCodes.Admin))
        {
            await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
            return;
        }

        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        if (clientId != currentClientId)
        {
            throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
        }

        await EnsureClientExistsAsync(clientId, fieldName, cancellationToken);
    }

    private async Task EnsureClientExistsAsync(Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Clients.AsNoTracking().AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested client does not exist."));
        }
    }

    private async Task EnsureInstallationExistsAsync(Guid installationId, string fieldName, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Installations.AsNoTracking().AnyAsync(x => x.Id == installationId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested installation does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested installation does not exist."));
        }
    }

    private async Task<Installation> ValidateInstallationAsync(Guid installationId, Guid clientId, string fieldName, CancellationToken cancellationToken)
    {
        var installation = await _dbContext.Installations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == installationId && x.ClientId == clientId && !x.IsDeleted, cancellationToken);

        if (installation is null)
        {
            throw new EntityNotFoundException("Installation not found for this client.");
        }

        return installation;
    }

    private async Task<TypeCatalog?> ValidateTypeAsync(Guid? id, string category, string fieldName, string invalidMessage, CancellationToken cancellationToken)
    {
        if (!id.HasValue)
        {
            return null;
        }

        var type = await _dbContext.Types
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id.Value && x.Category == category && !x.IsDeleted && x.IsActive, cancellationToken);

        if (type is null)
        {
            throw RequestValidationException.BadRequest(
                invalidMessage,
                RequestValidationException.Field(fieldName, "not_found", invalidMessage));
        }

        return type;
    }

    private Task<Plant?> LoadPlantAsync(Guid clientId, Guid plantId, CancellationToken cancellationToken)
        => _dbContext.Plants.SingleOrDefaultAsync(x => x.Id == plantId && x.ClientId == clientId && !x.IsDeleted, cancellationToken);

    private static void ValidateThresholdRange(decimal? minValue, decimal? maxValue)
    {
        if (minValue.HasValue && maxValue.HasValue && minValue.Value > maxValue.Value)
        {
            throw RequestValidationException.BadRequest(
                "minValue must be less than or equal to maxValue.",
                RequestValidationException.Field("minValue", "invalid_range", "minValue must be less than or equal to maxValue."));
        }
    }

    private static string RequireText(string input, string fieldKey, string fieldLabel, int maxLength)
    {
        var normalized = NormalizeOptional(input, fieldKey, maxLength);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                $"{fieldLabel} is required.",
                RequestValidationException.Field(fieldKey, "required", $"{fieldLabel} is required."));
        }

        return normalized;
    }

    private static string NormalizeRequiredCode(string input)
    {
        var normalized = NormalizeCodeOptional(input);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Plant code is required.",
                RequestValidationException.Field("code", "required", "Plant code is required."));
        }

        return normalized;
    }

    private static string? NormalizeCodeOptional(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = Regex.Replace(input.Trim().ToUpperInvariant(), "\\s+", "-");
        if (!PlantCodeRegex.IsMatch(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Plant code contains unsupported characters. Use only letters, numbers, hyphen and underscore.",
                RequestValidationException.Field("code", "invalid_format", "Plant code contains unsupported characters. Use only letters, numbers, hyphen and underscore."));
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? input, string fieldKey, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = input.Trim();
        if (normalized.Length > maxLength)
        {
            throw RequestValidationException.BadRequest(
                $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters.",
                RequestValidationException.Field(fieldKey, "max_length", $"{fieldKey} exceeds the maximum allowed length of {maxLength} characters."));
        }

        return normalized;
    }

    private static IReadOnlyList<int> NormalizeFloweringMonths(IReadOnlyList<int>? months)
    {
        if (months is null || months.Count == 0)
        {
            return Array.Empty<int>();
        }

        var normalized = months
            .Where(month => month >= 0 && month <= 11)
            .Distinct()
            .OrderBy(month => month)
            .ToArray();

        if (normalized.Length != months.Count)
        {
            throw RequestValidationException.BadRequest(
                "Flowering months contain invalid values.",
                RequestValidationException.Field("floweringMonths", "invalid_range", "Flowering months must be between 0 and 11."));
        }

        return normalized;
    }

    private static IReadOnlyList<string> NormalizeFertilizationSeasons(IReadOnlyList<string>? seasons)
    {
        if (seasons is null || seasons.Count == 0)
        {
            return Array.Empty<string>();
        }

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "winter",
            "spring",
            "summer",
            "autumn",
        };

        var normalized = seasons
            .Where(season => !string.IsNullOrWhiteSpace(season))
            .Select(season => season.Trim().ToLowerInvariant())
            .Distinct()
            .OrderBy(season => season)
            .ToArray();

        if (normalized.Length != seasons.Count || normalized.Any(season => !allowed.Contains(season)))
        {
            throw RequestValidationException.BadRequest(
                "Fertilization seasons contain invalid values.",
                RequestValidationException.Field("fertilizationSeasons", "invalid_value", "Fertilization seasons must be winter, spring, summer or autumn."));
        }

        return normalized;
    }
}

public sealed record ValidatedPlantScope(Plant Plant);
public sealed record ValidatedPlantAnalysisRequest(Guid ClientId);

public sealed record ValidatedCreatePlantRequest(
    Guid ClientId,
    Installation Installation,
    string Code,
    string Name,
    string? Description,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    IReadOnlyList<int> FloweringMonths,
    IReadOnlyList<string> FertilizationSeasons,
    bool IsActive
);

public sealed record ValidatedUpdatePlantRequest(
    Plant Plant,
    Installation? Installation,
    string? Code,
    string? Name,
    string? Description,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    IReadOnlyList<int>? FloweringMonths,
    IReadOnlyList<string>? FertilizationSeasons,
    bool? IsActive
);

public sealed record ValidatedPlantDeleteRequest(Plant Plant);

public sealed record ValidatedPlantsSearchRequest(
    Guid? EffectiveClientId,
    string? Code,
    string? Name,
    string? Description,
    Guid? InstallationId,
    Guid? PlantTypeId,
    Guid? PlantStatusId,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);

public sealed record ValidatedPlantPhotoRequest(Plant Plant);
public sealed record ValidatedCreatePlantPhotoRequest(Plant Plant, Guid? PhotoTypeId, string FileName, string FileUrl, bool IsPrimary, bool IsActive);
public sealed record ValidatedPhotoScope(Plant Plant, Photo Photo);

public sealed record ValidatedPlantThresholdRequest(Plant Plant);
public sealed record ValidatedCreatePlantThresholdRequest(Plant Plant, Guid ReadingTypeId, Guid? UnitTypeId, decimal? MinValue, decimal? MaxValue, decimal? OptimalValue, bool IsActive);
public sealed record ValidatedThresholdScope(Plant Plant, PlantThreshold Threshold);
public sealed record ValidatedUpdatePlantThresholdRequest(Plant Plant, PlantThreshold Threshold, Guid ReadingTypeId, Guid? UnitTypeId, decimal? MinValue, decimal? MaxValue, decimal? OptimalValue, bool? IsActive);

public sealed record ValidatedPlantEventRequest(Plant Plant);
public sealed record ValidatedCreatePlantEventRequest(Plant Plant, Guid EventTypeId, string Title, string? Description, string? Notes, DateTime EventDate, bool IsActive);
public sealed record ValidatedEventScope(Plant Plant, PlantEvent Event);
public sealed record ValidatedUpdatePlantEventRequest(Plant Plant, PlantEvent Event, Guid? EventTypeId, string? Title, string? Description, string? Notes, DateTime? EventDate, bool? IsActive);
