using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/internal/operations")]
[Authorize]
public sealed class InternalOperationsController : ControllerBase
{
    /// <summary>
    /// Comprova l estat basic del servei intern.
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "ok",
            scope = "internal",
            service = "GreenLytics.V3.Api",
            timestamp = DateTime.UtcNow,
        });
    }
}
