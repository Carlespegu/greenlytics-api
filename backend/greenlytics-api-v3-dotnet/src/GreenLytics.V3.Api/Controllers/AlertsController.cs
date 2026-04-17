using GreenLytics.V3.Application.Alerts;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class AlertsController : ControllerBase
{
    private readonly GetAlertDetailHandler _getAlertDetailHandler;
    private readonly SearchAlertsHandler _searchAlertsHandler;
    private readonly CreateAlertHandler _createAlertHandler;
    private readonly UpdateAlertHandler _updateAlertHandler;
    private readonly SetAlertActiveStatusHandler _setAlertActiveStatusHandler;

    public AlertsController(
        GetAlertDetailHandler getAlertDetailHandler,
        SearchAlertsHandler searchAlertsHandler,
        CreateAlertHandler createAlertHandler,
        UpdateAlertHandler updateAlertHandler,
        SetAlertActiveStatusHandler setAlertActiveStatusHandler)
    {
        _getAlertDetailHandler = getAlertDetailHandler;
        _searchAlertsHandler = searchAlertsHandler;
        _createAlertHandler = createAlertHandler;
        _updateAlertHandler = updateAlertHandler;
        _setAlertActiveStatusHandler = setAlertActiveStatusHandler;
    }

    /// <summary>
    /// Obte el detall d una alerta per id.
    /// </summary>
    [HttpGet("{alertId:guid}")]
    public async Task<ActionResult<ApiEnvelope<AlertDto>>> GetById(Guid alertId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getAlertDetailHandler.HandleAsync(alertId, cancellationToken);
            return Ok(new ApiEnvelope<AlertDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AlertDto>(exception);
        }
    }

    /// <summary>
    /// Cerca alertes amb filtres i paginacio.
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<AlertDto>>>> Search([FromBody] AlertsSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchAlertsHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<AlertDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<AlertDto>>(exception);
        }
    }

    /// <summary>
    /// Crea una alerta nova.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiEnvelope<AlertDto>>> Create([FromBody] CreateAlertRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createAlertHandler.HandleAsync(request.ToCommand(), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<AlertDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AlertDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza una alerta existent.
    /// </summary>
    [HttpPut("{alertId:guid}")]
    public async Task<ActionResult<ApiEnvelope<AlertDto>>> Update(Guid alertId, [FromBody] UpdateAlertRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updateAlertHandler.HandleAsync(request.ToCommand(alertId), cancellationToken);
            return Ok(new ApiEnvelope<AlertDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AlertDto>(exception);
        }
    }

    /// <summary>
    /// Activa una alerta.
    /// </summary>
    [HttpPost("{alertId:guid}/activate")]
    public async Task<ActionResult<ApiEnvelope<AlertDto>>> Activate(Guid alertId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setAlertActiveStatusHandler.HandleAsync(alertId, true, cancellationToken);
            return Ok(new ApiEnvelope<AlertDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AlertDto>(exception);
        }
    }

    /// <summary>
    /// Desactiva una alerta.
    /// </summary>
    [HttpPost("{alertId:guid}/deactivate")]
    public async Task<ActionResult<ApiEnvelope<AlertDto>>> Deactivate(Guid alertId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setAlertActiveStatusHandler.HandleAsync(alertId, false, cancellationToken);
            return Ok(new ApiEnvelope<AlertDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AlertDto>(exception);
        }
    }

    private ActionResult<ApiEnvelope<T>> ToErrorResult<T>(Exception exception)
        => exception switch
        {
            RequestValidationException validationException => StatusCode(
                validationException.StatusCode,
                new ApiEnvelope<T>(false, default, validationException.Message, validationException.ErrorCode, validationException.Errors)),
            ForbiddenOperationException forbiddenException => StatusCode(
                StatusCodes.Status403Forbidden,
                new ApiEnvelope<T>(
                    false,
                    default,
                    forbiddenException.Message,
                    "forbidden",
                    new[]
                    {
                        new ValidationError("clientId", "invalid_scope", forbiddenException.Message)
                    })),
            EntityNotFoundException notFoundException => NotFound(
                new ApiEnvelope<T>(false, default, notFoundException.Message, "not_found")),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error")),
        };
}

public sealed class CreateAlertRequest
{
    public Guid? ClientId { get; set; }
    public Guid? InstallationId { get; set; }
    public Guid? PlantId { get; set; }
    public Guid ReadingTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Channel { get; set; } = "EMAIL";
    public string? RecipientEmail { get; set; }
    public string ConditionType { get; set; } = string.Empty;
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? ExactNumericValue { get; set; }
    public string? ExactTextValue { get; set; }
    public bool? ExactBooleanValue { get; set; }
    public bool IsActive { get; set; } = true;

    public CreateAlertCommand ToCommand()
        => new(ClientId, InstallationId, PlantId, ReadingTypeId, Name, Description, Channel, RecipientEmail, ConditionType, MinValue, MaxValue, ExactNumericValue, ExactTextValue, ExactBooleanValue, IsActive);
}

public sealed class UpdateAlertRequest
{
    public Guid? ClientId { get; set; }
    public Guid? InstallationId { get; set; }
    public Guid? PlantId { get; set; }
    public Guid ReadingTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Channel { get; set; } = "EMAIL";
    public string? RecipientEmail { get; set; }
    public string ConditionType { get; set; } = string.Empty;
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? ExactNumericValue { get; set; }
    public string? ExactTextValue { get; set; }
    public bool? ExactBooleanValue { get; set; }
    public bool IsActive { get; set; } = true;

    public UpdateAlertCommand ToCommand(Guid alertId)
        => new(alertId, ClientId, InstallationId, PlantId, ReadingTypeId, Name, Description, Channel, RecipientEmail, ConditionType, MinValue, MaxValue, ExactNumericValue, ExactTextValue, ExactBooleanValue, IsActive);
}
