using GreenLytics.V3.Application.Clients;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class ClientsController : ControllerBase
{
    private readonly GetClientDetailHandler _getClientDetailHandler;
    private readonly SearchClientsHandler _searchClientsHandler;
    private readonly CreateClientHandler _createClientHandler;
    private readonly UpdateClientHandler _updateClientHandler;
    private readonly SetClientActiveStatusHandler _setClientActiveStatusHandler;

    public ClientsController(
        GetClientDetailHandler getClientDetailHandler,
        SearchClientsHandler searchClientsHandler,
        CreateClientHandler createClientHandler,
        UpdateClientHandler updateClientHandler,
        SetClientActiveStatusHandler setClientActiveStatusHandler)
    {
        _getClientDetailHandler = getClientDetailHandler;
        _searchClientsHandler = searchClientsHandler;
        _createClientHandler = createClientHandler;
        _updateClientHandler = updateClientHandler;
        _setClientActiveStatusHandler = setClientActiveStatusHandler;
    }

    /// <summary>
    /// Obte el detall d un client per id.
    /// </summary>
    [HttpGet("{clientId:guid}")]
    public async Task<ActionResult<ApiEnvelope<ClientDto>>> GetById(Guid clientId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getClientDetailHandler.HandleAsync(clientId, cancellationToken);
            return Ok(new ApiEnvelope<ClientDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<ClientDto>(exception);
        }
    }

    /// <summary>
    /// Cerca clients amb filtres i paginacio.
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<ClientDto>>>> Search([FromBody] ClientsSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchClientsHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<ClientDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<ClientDto>>(exception);
        }
    }

    /// <summary>
    /// Crea un client nou.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiEnvelope<ClientDto>>> Create([FromBody] CreateClientRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createClientHandler.HandleAsync(request.ToCommand(), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<ClientDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<ClientDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza un client existent.
    /// </summary>
    [HttpPut("{clientId:guid}")]
    public async Task<ActionResult<ApiEnvelope<ClientDto>>> Update(Guid clientId, [FromBody] UpdateClientRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updateClientHandler.HandleAsync(request.ToCommand(clientId), cancellationToken);
            return Ok(new ApiEnvelope<ClientDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<ClientDto>(exception);
        }
    }

    /// <summary>
    /// Activa un client.
    /// </summary>
    [HttpPost("{clientId:guid}/activate")]
    public async Task<ActionResult<ApiEnvelope<ClientDto>>> Activate(Guid clientId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setClientActiveStatusHandler.HandleAsync(clientId, true, cancellationToken);
            return Ok(new ApiEnvelope<ClientDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<ClientDto>(exception);
        }
    }

    /// <summary>
    /// Desactiva un client.
    /// </summary>
    [HttpPost("{clientId:guid}/deactivate")]
    public async Task<ActionResult<ApiEnvelope<ClientDto>>> Deactivate(Guid clientId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setClientActiveStatusHandler.HandleAsync(clientId, false, cancellationToken);
            return Ok(new ApiEnvelope<ClientDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<ClientDto>(exception);
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

public sealed class CreateClientRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public CreateClientCommand ToCommand()
        => new(Code, Name, Description, IsActive);
}

public sealed class UpdateClientRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public UpdateClientCommand ToCommand(Guid clientId)
        => new(clientId, Code, Name, Description, IsActive);
}
