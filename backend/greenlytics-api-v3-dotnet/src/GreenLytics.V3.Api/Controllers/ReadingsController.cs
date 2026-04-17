using GreenLytics.V3.Application.Readings;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/readings")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class ReadingsController : ControllerBase
{
    private readonly SearchReadingsHandler _searchReadingsHandler;
    private readonly GetReadingsTimeseriesHandler _getReadingsTimeseriesHandler;

    public ReadingsController(
        SearchReadingsHandler searchReadingsHandler,
        GetReadingsTimeseriesHandler getReadingsTimeseriesHandler)
    {
        _searchReadingsHandler = searchReadingsHandler;
        _getReadingsTimeseriesHandler = getReadingsTimeseriesHandler;
    }

    /// <summary>
    /// Cerca lectures amb filtres i paginacio.
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<ReadingResponse>>>> Search([FromBody] ReadingsSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchReadingsHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<ReadingResponse>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<ReadingResponse>>(exception);
        }
    }

    /// <summary>
    /// Retorna una serie temporal agregada de lectures.
    /// </summary>
    [HttpPost("timeseries")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<ReadingsTimeseriesPointDto>>>> Timeseries([FromBody] ReadingsTimeseriesRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getReadingsTimeseriesHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<ReadingsTimeseriesPointDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<ReadingsTimeseriesPointDto>>(exception);
        }
    }

    private ActionResult<ApiEnvelope<T>> ToErrorResult<T>(Exception exception)
        => exception switch
        {
            RequestValidationException validationException => StatusCode(validationException.StatusCode, new ApiEnvelope<T>(false, default, validationException.Message, validationException.ErrorCode, validationException.Errors)),
            ForbiddenOperationException forbiddenException => StatusCode(StatusCodes.Status403Forbidden, new ApiEnvelope<T>(false, default, forbiddenException.Message, "forbidden", new[] { new ValidationError("clientId", "invalid_scope", forbiddenException.Message) })),
            EntityNotFoundException notFoundException => NotFound(new ApiEnvelope<T>(false, default, notFoundException.Message, "not_found")),
            UnauthorizedAccessException unauthorizedException => StatusCode(StatusCodes.Status401Unauthorized, new ApiEnvelope<T>(false, default, unauthorizedException.Message, "unauthorized")),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error")),
        };
}
