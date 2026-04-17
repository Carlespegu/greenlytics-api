using GreenLytics.V3.Application.Readings;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/device-readings")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class DeviceReadingsController : ControllerBase
{
    private readonly IngestDeviceReadingsHandler _ingestHandler;
    private readonly GetLatestDeviceReadingHandler _getLatestHandler;
    private readonly GetDeviceReadingHistoryHandler _getHistoryHandler;

    public DeviceReadingsController(
        IngestDeviceReadingsHandler ingestHandler,
        GetLatestDeviceReadingHandler getLatestHandler,
        GetDeviceReadingHistoryHandler getHistoryHandler)
    {
        _ingestHandler = ingestHandler;
        _getLatestHandler = getLatestHandler;
        _getHistoryHandler = getHistoryHandler;
    }

    /// <summary>
    /// Registra una lectura de dispositiu amb tots els seus valors.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiEnvelope<DeviceReadingsIngestResult>>> Create(
        [FromBody] DeviceReadingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _ingestHandler.HandleAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<DeviceReadingsIngestResult>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<DeviceReadingsIngestResult>(exception);
        }
    }

    /// <summary>
    /// Obte l ultima lectura completa d un dispositiu.
    /// </summary>
    [HttpGet("latest/{deviceCode}")]
    public async Task<ActionResult<ApiEnvelope<LatestDeviceReadingDto>>> GetLatest(
        string deviceCode,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getLatestHandler.HandleAsync(deviceCode, cancellationToken);
            return Ok(new ApiEnvelope<LatestDeviceReadingDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<LatestDeviceReadingDto>(exception);
        }
    }

    /// <summary>
    /// Obte l historic de lectures d un dispositiu.
    /// </summary>
    [HttpGet("history/{deviceCode}")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<DeviceReadingResponse>>>> GetHistory(
        string deviceCode,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getHistoryHandler.HandleAsync(deviceCode, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<DeviceReadingResponse>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<DeviceReadingResponse>>(exception);
        }
    }

    private ActionResult<ApiEnvelope<T>> ToErrorResult<T>(Exception exception)
        => exception switch
        {
            RequestValidationException validationException => StatusCode(
                validationException.StatusCode,
                new ApiEnvelope<T>(false, default, validationException.Message, validationException.ErrorCode, validationException.Errors)),
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
