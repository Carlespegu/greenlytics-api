using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/types")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class TypesController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public TypesController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("options")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<TypeOptionDto>>>> GetOptions([FromQuery] string category, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest(new ApiEnvelope<IReadOnlyList<TypeOptionDto>>(
                false,
                default,
                "Category is required.",
                "validation_error",
                new[]
                {
                    new ValidationError("category", "required", "Category is required.")
                }));
        }

        var result = await _dbContext.Types
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive && x.Category == category)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new TypeOptionDto(x.Id, x.Code, x.Name, x.Description))
            .ToArrayAsync(cancellationToken);

        return Ok(new ApiEnvelope<IReadOnlyList<TypeOptionDto>>(true, result));
    }
}

public sealed record TypeOptionDto(
    Guid Id,
    string Code,
    string Name,
    string? Description);
