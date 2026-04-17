using GreenLytics.V3.Application.Devices;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class DevicesController : ControllerBase
{
    private readonly GetDeviceDetailHandler _getDeviceDetailHandler;
    private readonly SearchDevicesHandler _searchDevicesHandler;
    private readonly CreateDeviceHandler _createDeviceHandler;
    private readonly UpdateDeviceHandler _updateDeviceHandler;
    private readonly DeleteDeviceHandler _deleteDeviceHandler;
    private readonly SetDeviceActiveStatusHandler _setDeviceActiveStatusHandler;
    private readonly RotateDeviceSecretHandler _rotateDeviceSecretHandler;

    public DevicesController(
        GetDeviceDetailHandler getDeviceDetailHandler,
        SearchDevicesHandler searchDevicesHandler,
        CreateDeviceHandler createDeviceHandler,
        UpdateDeviceHandler updateDeviceHandler,
        DeleteDeviceHandler deleteDeviceHandler,
        SetDeviceActiveStatusHandler setDeviceActiveStatusHandler,
        RotateDeviceSecretHandler rotateDeviceSecretHandler)
    {
        _getDeviceDetailHandler = getDeviceDetailHandler;
        _searchDevicesHandler = searchDevicesHandler;
        _createDeviceHandler = createDeviceHandler;
        _updateDeviceHandler = updateDeviceHandler;
        _deleteDeviceHandler = deleteDeviceHandler;
        _setDeviceActiveStatusHandler = setDeviceActiveStatusHandler;
        _rotateDeviceSecretHandler = rotateDeviceSecretHandler;
    }

    /// <summary>
    /// Cerca dispositius amb filtres, paginacio i dades de context operatiu.
    /// </summary>
    [HttpPost("devices/search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<DeviceListItemDto>>>> Search([FromBody] DevicesSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchDevicesHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<DeviceListItemDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<DeviceListItemDto>>(exception);
        }
    }

    /// <summary>
    /// Obte el detall d un dispositiu dins del context d un client.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/devices/{deviceId:guid}")]
    public async Task<ActionResult<ApiEnvelope<DeviceDetailDto>>> GetById(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getDeviceDetailHandler.HandleAsync(clientId, deviceId, cancellationToken);
            return Ok(new ApiEnvelope<DeviceDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceDetailDto>(exception);
        }
    }

    /// <summary>
    /// Crea un dispositiu nou dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/devices")]
    public async Task<ActionResult<ApiEnvelope<DeviceDetailDto>>> Create(Guid clientId, [FromBody] CreateDeviceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createDeviceHandler.HandleAsync(request.ToCommand(clientId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<DeviceDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceDetailDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza parcialment un dispositiu dins del context d un client.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/devices/{deviceId:guid}")]
    public async Task<ActionResult<ApiEnvelope<DeviceDetailDto>>> Update(Guid clientId, Guid deviceId, [FromBody] UpdateDeviceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updateDeviceHandler.HandleAsync(request.ToCommand(clientId, deviceId), cancellationToken);
            return Ok(new ApiEnvelope<DeviceDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceDetailDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament un dispositiu dins del context d un client.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/devices/{deviceId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> Delete(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
    {
        try
        {
            await _deleteDeviceHandler.HandleAsync(new DeleteDeviceCommand(clientId, deviceId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    /// <summary>
    /// Activa un dispositiu dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/devices/{deviceId:guid}/activate")]
    public async Task<ActionResult<ApiEnvelope<DeviceDetailDto>>> Activate(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setDeviceActiveStatusHandler.HandleAsync(clientId, deviceId, true, cancellationToken);
            return Ok(new ApiEnvelope<DeviceDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceDetailDto>(exception);
        }
    }

    /// <summary>
    /// Desactiva un dispositiu dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/devices/{deviceId:guid}/deactivate")]
    public async Task<ActionResult<ApiEnvelope<DeviceDetailDto>>> Deactivate(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setDeviceActiveStatusHandler.HandleAsync(clientId, deviceId, false, cancellationToken);
            return Ok(new ApiEnvelope<DeviceDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceDetailDto>(exception);
        }
    }

    /// <summary>
    /// Genera o rota el secret d autenticacio d un dispositiu i el retorna una sola vegada.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/devices/{deviceId:guid}/rotate-secret")]
    public async Task<ActionResult<ApiEnvelope<DeviceSecretResult>>> RotateSecret(Guid clientId, Guid deviceId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _rotateDeviceSecretHandler.HandleAsync(new RotateDeviceSecretCommand(clientId, deviceId), cancellationToken);
            return Ok(new ApiEnvelope<DeviceSecretResult>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceSecretResult>(exception);
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

public sealed class CreateDeviceRequest
{
    public Guid InstallationId { get; set; }
    public Guid DeviceTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool? IsActive { get; set; }

    public CreateDeviceCommand ToCommand(Guid clientId)
        => new(clientId, InstallationId, DeviceTypeId, Code, Name, SerialNumber, FirmwareVersion, IsActive);
}

public sealed class UpdateDeviceRequest
{
    public Guid? InstallationId { get; set; }
    public Guid? DeviceTypeId { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? SerialNumber { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool? IsActive { get; set; }

    public UpdateDeviceCommand ToCommand(Guid clientId, Guid deviceId)
        => new(clientId, deviceId, InstallationId, DeviceTypeId, Code, Name, SerialNumber, FirmwareVersion, IsActive);
}
