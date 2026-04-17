using GreenLytics.V3.Application.Installations;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class InstallationsController : ControllerBase
{
    private readonly GetInstallationDetailHandler _getInstallationDetailHandler;
    private readonly SearchInstallationsHandler _searchInstallationsHandler;
    private readonly CreateInstallationHandler _createInstallationHandler;
    private readonly UpdateInstallationHandler _updateInstallationHandler;
    private readonly DeleteInstallationHandler _deleteInstallationHandler;
    private readonly SetInstallationActiveStatusHandler _setInstallationActiveStatusHandler;

    public InstallationsController(
        GetInstallationDetailHandler getInstallationDetailHandler,
        SearchInstallationsHandler searchInstallationsHandler,
        CreateInstallationHandler createInstallationHandler,
        UpdateInstallationHandler updateInstallationHandler,
        DeleteInstallationHandler deleteInstallationHandler,
        SetInstallationActiveStatusHandler setInstallationActiveStatusHandler)
    {
        _getInstallationDetailHandler = getInstallationDetailHandler;
        _searchInstallationsHandler = searchInstallationsHandler;
        _createInstallationHandler = createInstallationHandler;
        _updateInstallationHandler = updateInstallationHandler;
        _deleteInstallationHandler = deleteInstallationHandler;
        _setInstallationActiveStatusHandler = setInstallationActiveStatusHandler;
    }

    /// <summary>
    /// Cerca instal lacions amb filtres, paginacio i dades de context operatiu.
    /// </summary>
    [HttpPost("installations/search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<InstallationListItemDto>>>> Search([FromBody] InstallationsSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchInstallationsHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<InstallationListItemDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<InstallationListItemDto>>(exception);
        }
    }

    /// <summary>
    /// Obte el detall d una instal lacio dins del context d un client.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/installations/{installationId:guid}")]
    public async Task<ActionResult<ApiEnvelope<InstallationDetailDto>>> GetById(Guid clientId, Guid installationId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getInstallationDetailHandler.HandleAsync(clientId, installationId, cancellationToken);
            return Ok(new ApiEnvelope<InstallationDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<InstallationDetailDto>(exception);
        }
    }

    /// <summary>
    /// Crea una instal lacio nova dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/installations")]
    public async Task<ActionResult<ApiEnvelope<InstallationDetailDto>>> Create(Guid clientId, [FromBody] CreateInstallationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createInstallationHandler.HandleAsync(request.ToCommand(clientId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<InstallationDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<InstallationDetailDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza parcialment una instal lacio dins del context d un client.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/installations/{installationId:guid}")]
    public async Task<ActionResult<ApiEnvelope<InstallationDetailDto>>> Update(Guid clientId, Guid installationId, [FromBody] UpdateInstallationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updateInstallationHandler.HandleAsync(request.ToCommand(clientId, installationId), cancellationToken);
            return Ok(new ApiEnvelope<InstallationDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<InstallationDetailDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament una instal lacio dins del context d un client.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/installations/{installationId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> Delete(Guid clientId, Guid installationId, CancellationToken cancellationToken)
    {
        try
        {
            await _deleteInstallationHandler.HandleAsync(new DeleteInstallationCommand(clientId, installationId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    /// <summary>
    /// Activa una instal lacio dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/installations/{installationId:guid}/activate")]
    public async Task<ActionResult<ApiEnvelope<InstallationDetailDto>>> Activate(Guid clientId, Guid installationId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setInstallationActiveStatusHandler.HandleAsync(clientId, installationId, true, cancellationToken);
            return Ok(new ApiEnvelope<InstallationDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<InstallationDetailDto>(exception);
        }
    }

    /// <summary>
    /// Desactiva una instal lacio dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/installations/{installationId:guid}/deactivate")]
    public async Task<ActionResult<ApiEnvelope<InstallationDetailDto>>> Deactivate(Guid clientId, Guid installationId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setInstallationActiveStatusHandler.HandleAsync(clientId, installationId, false, cancellationToken);
            return Ok(new ApiEnvelope<InstallationDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<InstallationDetailDto>(exception);
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
            UnauthorizedAccessException unauthorizedException => StatusCode(
                StatusCodes.Status401Unauthorized,
                new ApiEnvelope<T>(false, default, unauthorizedException.Message, "unauthorized")),
            EntityNotFoundException notFoundException => NotFound(
                new ApiEnvelope<T>(false, default, notFoundException.Message, "not_found")),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error")),
        };
}

public sealed class CreateInstallationRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool? IsActive { get; set; }

    public CreateInstallationCommand ToCommand(Guid clientId)
        => new(clientId, Code, Name, Description, Location, IsActive);
}

public sealed class UpdateInstallationRequest
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool? IsActive { get; set; }

    public UpdateInstallationCommand ToCommand(Guid clientId, Guid installationId)
        => new(clientId, installationId, Code, Name, Description, Location, IsActive);
}
