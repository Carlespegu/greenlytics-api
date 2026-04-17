using GreenLytics.V3.Application.TableMetadata;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/table-metadata")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class TableMetadataController : ControllerBase
{
    private readonly GetTableFieldMetadataHandler _getTableFieldMetadataHandler;

    public TableMetadataController(GetTableFieldMetadataHandler getTableFieldMetadataHandler)
    {
        _getTableFieldMetadataHandler = getTableFieldMetadataHandler;
    }

    /// <summary>
    /// Obte la metadata de camps d una taula.
    /// </summary>
    [HttpGet("{tableName}")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<TableFieldMetadataDto>>>> GetFields(string tableName, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getTableFieldMetadataHandler.HandleAsync(tableName, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<TableFieldMetadataDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<TableFieldMetadataDto>>(exception);
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
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error")),
        };
}
