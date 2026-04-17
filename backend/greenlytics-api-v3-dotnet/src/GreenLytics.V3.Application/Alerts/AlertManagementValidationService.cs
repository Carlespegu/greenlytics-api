using System.Net.Mail;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Alerts;

public sealed class AlertManagementValidationService
{
    private static readonly HashSet<string> AllowedChannels = new(StringComparer.OrdinalIgnoreCase) { "EMAIL" };
    private static readonly HashSet<string> AllowedConditionTypes = new(StringComparer.OrdinalIgnoreCase) { "MIN", "MAX", "RANGE", "EQUALS", "BOOLEAN_EQUALS" };

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public AlertManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedAlertScope> ValidateReadAsync(Guid alertId, CancellationToken cancellationToken = default)
    {
        AlertManagementPolicy.RequireCanViewAlerts(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);

        var query = _dbContext.Alerts
            .AsNoTracking()
            .Where(x => x.Id == alertId && !x.IsDeleted);

        if (!AlertManagementPolicy.IsAdmin(_currentUser))
        {
            query = query.Where(x => x.ClientId == currentClientId);
        }

        var alert = await query.SingleOrDefaultAsync(cancellationToken);
        if (alert is null)
        {
            throw new EntityNotFoundException("The requested alert was not found.");
        }

        return new ValidatedAlertScope(alert);
    }

    public async Task<ValidatedCreateAlertRequest> ValidateCreateAsync(CreateAlertCommand command, CancellationToken cancellationToken = default)
    {
        AlertManagementPolicy.RequireCanManageAlerts(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var effectiveClientId = await ResolveEffectiveClientIdAsync(command.ClientId, currentClientId, cancellationToken);

        var name = RequireText(command.Name, "name", "Alert name", 150);
        var description = NormalizeOptional(command.Description, "description", 500);
        var channel = NormalizeChannel(command.Channel);
        var recipientEmail = NormalizeRecipientEmail(command.RecipientEmail, channel);
        var readingType = await ValidateReadingTypeAsync(command.ReadingTypeId, cancellationToken);
        var conditionType = NormalizeConditionType(command.ConditionType);
        var installation = await ValidateInstallationAsync(command.InstallationId, effectiveClientId, cancellationToken);
        var plant = await ValidatePlantAsync(command.PlantId, effectiveClientId, installation, cancellationToken);

        ValidateRuleForReadingType(
            readingType,
            conditionType,
            command.MinValue,
            command.MaxValue,
            command.ExactNumericValue,
            NormalizeOptional(command.ExactTextValue, "exactTextValue", 255),
            command.ExactBooleanValue);

        var duplicateExists = await _dbContext.Alerts
            .AnyAsync(x => !x.IsDeleted && x.ClientId == effectiveClientId && x.Name == name, cancellationToken);
        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                $"Alert with name '{name}' already exists for this client.",
                RequestValidationException.Field("name", "duplicate", $"Alert with name '{name}' already exists for this client."));
        }

        return new ValidatedCreateAlertRequest(
            effectiveClientId,
            installation?.Id,
            plant?.Id,
            readingType,
            name,
            description,
            channel,
            recipientEmail,
            conditionType,
            command.MinValue,
            command.MaxValue,
            command.ExactNumericValue,
            NormalizeOptional(command.ExactTextValue, "exactTextValue", 255),
            command.ExactBooleanValue,
            command.IsActive);
    }

    public async Task<ValidatedUpdateAlertRequest> ValidateUpdateAsync(UpdateAlertCommand command, CancellationToken cancellationToken = default)
    {
        AlertManagementPolicy.RequireCanManageAlerts(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);

        var query = _dbContext.Alerts.Where(x => x.Id == command.AlertId && !x.IsDeleted);
        if (!AlertManagementPolicy.IsAdmin(_currentUser))
        {
            query = query.Where(x => x.ClientId == currentClientId);
        }

        var alert = await query.SingleOrDefaultAsync(cancellationToken);
        if (alert is null)
        {
            throw new EntityNotFoundException("The requested alert was not found.");
        }

        var effectiveClientId = await ResolveEffectiveClientIdAsync(command.ClientId, alert.ClientId, cancellationToken);
        var name = RequireText(command.Name, "name", "Alert name", 150);
        var description = NormalizeOptional(command.Description, "description", 500);
        var channel = NormalizeChannel(command.Channel);
        var recipientEmail = NormalizeRecipientEmail(command.RecipientEmail, channel);
        var readingType = await ValidateReadingTypeAsync(command.ReadingTypeId, cancellationToken);
        var conditionType = NormalizeConditionType(command.ConditionType);
        var installation = await ValidateInstallationAsync(command.InstallationId, effectiveClientId, cancellationToken);
        var plant = await ValidatePlantAsync(command.PlantId, effectiveClientId, installation, cancellationToken);
        var exactTextValue = NormalizeOptional(command.ExactTextValue, "exactTextValue", 255);

        ValidateRuleForReadingType(
            readingType,
            conditionType,
            command.MinValue,
            command.MaxValue,
            command.ExactNumericValue,
            exactTextValue,
            command.ExactBooleanValue);

        var duplicateExists = await _dbContext.Alerts
            .AnyAsync(x => !x.IsDeleted && x.ClientId == effectiveClientId && x.Name == name && x.Id != alert.Id, cancellationToken);
        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                $"Alert with name '{name}' already exists for this client.",
                RequestValidationException.Field("name", "duplicate", $"Alert with name '{name}' already exists for this client."));
        }

        return new ValidatedUpdateAlertRequest(
            alert,
            effectiveClientId,
            installation?.Id,
            plant?.Id,
            readingType,
            name,
            description,
            channel,
            recipientEmail,
            conditionType,
            command.MinValue,
            command.MaxValue,
            command.ExactNumericValue,
            exactTextValue,
            command.ExactBooleanValue,
            command.IsActive);
    }

    public async Task<ValidatedAlertStatusChange> ValidateStatusChangeAsync(Guid alertId, CancellationToken cancellationToken = default)
    {
        AlertManagementPolicy.RequireCanManageAlerts(_currentUser);
        var validated = await ValidateReadAsync(alertId, cancellationToken);
        return new ValidatedAlertStatusChange(validated.Alert);
    }

    public async Task<ValidatedAlertsSearchRequest> ValidateSearchAsync(AlertsSearchRequest request, CancellationToken cancellationToken = default)
    {
        AlertManagementPolicy.RequireCanViewAlerts(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var filters = request.Filters ?? new AlertSearchFilters(null, null, null, null, null, null, null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        Guid? effectiveClientId;
        if (AlertManagementPolicy.IsAdmin(_currentUser))
        {
            effectiveClientId = filters.ClientId;
            if (effectiveClientId.HasValue)
            {
                var clientExists = await _dbContext.Clients.AnyAsync(x => x.Id == effectiveClientId.Value && !x.IsDeleted, cancellationToken);
                if (!clientExists)
                {
                    throw RequestValidationException.BadRequest(
                        "The requested client does not exist.",
                        RequestValidationException.Field("filters.clientId", "not_found", "The requested client does not exist."));
                }
            }
        }
        else
        {
            if (filters.ClientId.HasValue && filters.ClientId.Value != currentClientId)
            {
                throw new ForbiddenOperationException("The requested client scope is not available for the current user.");
            }

            effectiveClientId = currentClientId;
        }

        if (filters.InstallationId.HasValue)
        {
            _ = await ValidateInstallationAsync(filters.InstallationId, effectiveClientId ?? currentClientId, cancellationToken, "filters.installationId");
        }

        if (filters.PlantId.HasValue)
        {
            _ = await ValidatePlantAsync(filters.PlantId, effectiveClientId ?? currentClientId, null, cancellationToken, "filters.plantId");
        }

        if (filters.ReadingTypeId.HasValue)
        {
            _ = await ValidateReadingTypeAsync(filters.ReadingTypeId.Value, cancellationToken);
        }

        return new ValidatedAlertsSearchRequest(
            effectiveClientId,
            NormalizeOptional(filters.Name, "filters.name", 150),
            filters.InstallationId,
            filters.PlantId,
            filters.ReadingTypeId,
            filters.IsActive,
            NormalizeOptional(filters.Channel, "filters.channel", 30)?.ToUpperInvariant(),
            NormalizeOptional(filters.ConditionType, "filters.conditionType", 30)?.ToUpperInvariant(),
            NormalizeOptional(filters.RecipientEmail, "filters.recipientEmail", 255)?.ToLowerInvariant(),
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(request.Sort, "createdAt", "name", "createdAt", "updatedAt", "isActive", "channel", "conditionType"));
    }

    private async Task<Guid> ResolveEffectiveClientIdAsync(Guid? requestedClientId, Guid fallbackClientId, CancellationToken cancellationToken)
    {
        if (!AlertManagementPolicy.IsAdmin(_currentUser))
        {
            return CurrentUserAuthorization.RequireClientScope(_currentUser);
        }

        var clientId = requestedClientId ?? fallbackClientId;
        var exists = await _dbContext.Clients.AnyAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw RequestValidationException.BadRequest(
                "The requested client does not exist.",
                RequestValidationException.Field("clientId", "not_found", "The requested client does not exist."));
        }

        return clientId;
    }

    private async Task<Installation?> ValidateInstallationAsync(Guid? installationId, Guid clientId, CancellationToken cancellationToken, string fieldName = "installationId")
    {
        if (!installationId.HasValue)
        {
            return null;
        }

        var installation = await _dbContext.Installations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == installationId.Value && !x.IsDeleted, cancellationToken);

        if (installation is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested installation does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested installation does not exist."));
        }

        if (installation.ClientId != clientId)
        {
            throw new ForbiddenOperationException("The requested installation is not available for the current user.");
        }

        return installation;
    }

    private async Task<Plant?> ValidatePlantAsync(Guid? plantId, Guid clientId, Installation? installation, CancellationToken cancellationToken, string fieldName = "plantId")
    {
        if (!plantId.HasValue)
        {
            return null;
        }

        var plant = await _dbContext.Plants
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == plantId.Value && !x.IsDeleted, cancellationToken);

        if (plant is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested plant does not exist.",
                RequestValidationException.Field(fieldName, "not_found", "The requested plant does not exist."));
        }

        if (plant.ClientId != clientId)
        {
            throw new ForbiddenOperationException("The requested plant is not available for the current user.");
        }

        if (installation is not null && plant.InstallationId != installation.Id)
        {
            throw RequestValidationException.Conflict(
                "The selected plant does not belong to the selected installation.",
                RequestValidationException.Field("plantId", "inconsistent_scope", "The selected plant does not belong to the selected installation."),
                RequestValidationException.Field("installationId", "inconsistent_scope", "The selected plant does not belong to the selected installation."));
        }

        return plant;
    }

    private async Task<ReadingType> ValidateReadingTypeAsync(Guid readingTypeId, CancellationToken cancellationToken)
    {
        var readingType = await _dbContext.ReadingTypes
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == readingTypeId && x.IsActive, cancellationToken);

        if (readingType is null)
        {
            throw RequestValidationException.BadRequest(
                "The requested reading type does not exist.",
                RequestValidationException.Field("readingTypeId", "not_found", "The requested reading type does not exist."));
        }

        return readingType;
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

    private static string NormalizeOptionalRequired(string input, string fieldKey, int maxLength)
    {
        return RequireText(input, fieldKey, fieldKey, maxLength);
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

    private static string NormalizeChannel(string input)
    {
        var channel = NormalizeOptionalRequired(input, "channel", 30).ToUpperInvariant();
        if (!AllowedChannels.Contains(channel))
        {
            throw RequestValidationException.BadRequest(
                $"Unsupported channel '{input}'.",
                RequestValidationException.Field("channel", "unsupported", $"Unsupported channel '{input}'."));
        }

        return channel;
    }

    private static string? NormalizeRecipientEmail(string? input, string channel)
    {
        var normalized = NormalizeOptional(input, "recipientEmail", 255)?.ToLowerInvariant();
        if (channel == "EMAIL" && string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Recipient email is required for EMAIL alerts.",
                RequestValidationException.Field("recipientEmail", "required", "Recipient email is required for EMAIL alerts."));
        }

        if (normalized is null)
        {
            return null;
        }

        try
        {
            _ = new MailAddress(normalized);
        }
        catch
        {
            throw RequestValidationException.BadRequest(
                "Recipient email is not valid.",
                RequestValidationException.Field("recipientEmail", "invalid_format", "Recipient email is not valid."));
        }

        return normalized;
    }

    private static string NormalizeConditionType(string input)
    {
        var conditionType = NormalizeOptionalRequired(input, "conditionType", 30).ToUpperInvariant();
        if (!AllowedConditionTypes.Contains(conditionType))
        {
            throw RequestValidationException.BadRequest(
                $"Unsupported condition type '{input}'.",
                RequestValidationException.Field("conditionType", "unsupported", $"Unsupported condition type '{input}'."));
        }

        return conditionType;
    }

    private static void ValidateRuleForReadingType(
        ReadingType readingType,
        string conditionType,
        decimal? minValue,
        decimal? maxValue,
        decimal? exactNumericValue,
        string? exactTextValue,
        bool? exactBooleanValue)
    {
        var valueType = (readingType.ValueType ?? string.Empty).Trim().ToLowerInvariant();
        var numericTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "decimal", "integer", "number", "numeric" };

        if (numericTypes.Contains(valueType))
        {
            switch (conditionType)
            {
                case "MIN" when !minValue.HasValue:
                    throw RequestValidationException.BadRequest("minValue is required for MIN condition.", RequestValidationException.Field("minValue", "required", "minValue is required for MIN condition."));
                case "MAX" when !maxValue.HasValue:
                    throw RequestValidationException.BadRequest("maxValue is required for MAX condition.", RequestValidationException.Field("maxValue", "required", "maxValue is required for MAX condition."));
                case "RANGE" when !minValue.HasValue || !maxValue.HasValue:
                    throw RequestValidationException.BadRequest("minValue and maxValue are required for RANGE condition.",
                        RequestValidationException.Field("minValue", "required", "minValue and maxValue are required for RANGE condition."),
                        RequestValidationException.Field("maxValue", "required", "minValue and maxValue are required for RANGE condition."));
                case "RANGE" when minValue > maxValue:
                    throw RequestValidationException.BadRequest("minValue cannot be greater than maxValue.",
                        RequestValidationException.Field("minValue", "invalid_range", "minValue cannot be greater than maxValue."),
                        RequestValidationException.Field("maxValue", "invalid_range", "minValue cannot be greater than maxValue."));
                case "EQUALS" when !exactNumericValue.HasValue:
                    throw RequestValidationException.BadRequest("exactNumericValue is required for EQUALS condition with numeric reading type.",
                        RequestValidationException.Field("exactNumericValue", "required", "exactNumericValue is required for EQUALS condition with numeric reading type."));
                case "BOOLEAN_EQUALS":
                    throw RequestValidationException.BadRequest("BOOLEAN_EQUALS is not valid for numeric reading type.",
                        RequestValidationException.Field("conditionType", "invalid_for_value_type", "BOOLEAN_EQUALS is not valid for numeric reading type."));
            }

            if (exactTextValue is not null || exactBooleanValue.HasValue)
            {
                throw RequestValidationException.BadRequest(
                    "Text or boolean exact values are not valid for numeric reading type.",
                    RequestValidationException.Field("exactTextValue", "invalid_for_value_type", "Text or boolean exact values are not valid for numeric reading type."),
                    RequestValidationException.Field("exactBooleanValue", "invalid_for_value_type", "Text or boolean exact values are not valid for numeric reading type."));
            }

            return;
        }

        if (valueType is "string" or "text")
        {
            if (conditionType != "EQUALS")
            {
                throw RequestValidationException.BadRequest(
                    "Text reading type only supports EQUALS condition.",
                    RequestValidationException.Field("conditionType", "invalid_for_value_type", "Text reading type only supports EQUALS condition."));
            }

            if (string.IsNullOrWhiteSpace(exactTextValue))
            {
                throw RequestValidationException.BadRequest(
                    "exactTextValue is required for text reading type.",
                    RequestValidationException.Field("exactTextValue", "required", "exactTextValue is required for text reading type."));
            }

            if (minValue.HasValue || maxValue.HasValue || exactNumericValue.HasValue || exactBooleanValue.HasValue)
            {
                throw RequestValidationException.BadRequest(
                    "Numeric or boolean values are not valid for text reading type.",
                    RequestValidationException.Field("minValue", "invalid_for_value_type", "Numeric or boolean values are not valid for text reading type."));
            }

            return;
        }

        if (valueType == "boolean")
        {
            if (conditionType != "BOOLEAN_EQUALS")
            {
                throw RequestValidationException.BadRequest(
                    "Boolean reading type only supports BOOLEAN_EQUALS condition.",
                    RequestValidationException.Field("conditionType", "invalid_for_value_type", "Boolean reading type only supports BOOLEAN_EQUALS condition."));
            }

            if (!exactBooleanValue.HasValue)
            {
                throw RequestValidationException.BadRequest(
                    "exactBooleanValue is required for boolean reading type.",
                    RequestValidationException.Field("exactBooleanValue", "required", "exactBooleanValue is required for boolean reading type."));
            }

            if (minValue.HasValue || maxValue.HasValue || exactNumericValue.HasValue || !string.IsNullOrWhiteSpace(exactTextValue))
            {
                throw RequestValidationException.BadRequest(
                    "Numeric or text values are not valid for boolean reading type.",
                    RequestValidationException.Field("exactBooleanValue", "invalid_for_value_type", "Numeric or text values are not valid for boolean reading type."));
            }

            return;
        }

        throw RequestValidationException.BadRequest(
            $"Unsupported reading type valueType '{readingType.ValueType}'.",
            RequestValidationException.Field("readingTypeId", "unsupported_value_type", $"Unsupported reading type valueType '{readingType.ValueType}'."));
    }
}

public sealed record ValidatedAlertScope(Alert Alert);

public sealed record ValidatedCreateAlertRequest(
    Guid ClientId,
    Guid? InstallationId,
    Guid? PlantId,
    ReadingType ReadingType,
    string Name,
    string? Description,
    string Channel,
    string? RecipientEmail,
    string ConditionType,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? ExactNumericValue,
    string? ExactTextValue,
    bool? ExactBooleanValue,
    bool IsActive
);

public sealed record ValidatedUpdateAlertRequest(
    Alert Alert,
    Guid ClientId,
    Guid? InstallationId,
    Guid? PlantId,
    ReadingType ReadingType,
    string Name,
    string? Description,
    string Channel,
    string? RecipientEmail,
    string ConditionType,
    decimal? MinValue,
    decimal? MaxValue,
    decimal? ExactNumericValue,
    string? ExactTextValue,
    bool? ExactBooleanValue,
    bool IsActive
);

public sealed record ValidatedAlertStatusChange(Alert Alert);

public sealed record ValidatedAlertsSearchRequest(
    Guid? EffectiveClientId,
    string? Name,
    Guid? InstallationId,
    Guid? PlantId,
    Guid? ReadingTypeId,
    bool? IsActive,
    string? Channel,
    string? ConditionType,
    string? RecipientEmail,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);
