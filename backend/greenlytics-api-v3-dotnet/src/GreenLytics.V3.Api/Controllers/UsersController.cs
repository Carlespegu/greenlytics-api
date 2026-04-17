using GreenLytics.V3.Application.Users;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class UsersController : ControllerBase
{
    private readonly CreateUserHandler _createUserHandler;
    private readonly SearchUsersHandler _searchUsersHandler;
    private readonly GetUserDetailHandler _getUserDetailHandler;
    private readonly UpdateUserHandler _updateUserHandler;
    private readonly SetUserActiveStatusHandler _setUserActiveStatusHandler;
    private readonly ResendUserInviteHandler _resendUserInviteHandler;

    public UsersController(
        CreateUserHandler createUserHandler,
        SearchUsersHandler searchUsersHandler,
        GetUserDetailHandler getUserDetailHandler,
        UpdateUserHandler updateUserHandler,
        SetUserActiveStatusHandler setUserActiveStatusHandler,
        ResendUserInviteHandler resendUserInviteHandler)
    {
        _createUserHandler = createUserHandler;
        _searchUsersHandler = searchUsersHandler;
        _getUserDetailHandler = getUserDetailHandler;
        _updateUserHandler = updateUserHandler;
        _setUserActiveStatusHandler = setUserActiveStatusHandler;
        _resendUserInviteHandler = resendUserInviteHandler;
    }

    /// <summary>
    /// Crea un usuari nou amb provisioning invite o password.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createUserHandler.HandleAsync(request.ToCommand(), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<UserDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
        }
    }

    /// <summary>
    /// Cerca usuaris amb filtres i paginacio.
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<UserDto>>>> Search([FromBody] UsersSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchUsersHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<UserDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<UserDto>>(exception);
        }
    }

    /// <summary>
    /// Obte el detall d un usuari per id.
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> GetById(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getUserDetailHandler.HandleAsync(userId, cancellationToken);
            return Ok(new ApiEnvelope<UserDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza un usuari existent.
    /// </summary>
    [HttpPut("/api/clients/{clientId:guid}/users/{userId:guid}")]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> Update(Guid clientId, Guid userId, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updateUserHandler.HandleAsync(request.ToCommand(clientId, userId), cancellationToken);
            return Ok(new ApiEnvelope<UserDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
        }
    }

    /// <summary>
    /// Activa un usuari.
    /// </summary>
    [HttpPost("{userId:guid}/activate")]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> Activate(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setUserActiveStatusHandler.HandleAsync(userId, true, cancellationToken);
            return Ok(new ApiEnvelope<UserDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
        }
    }

    /// <summary>
    /// Desactiva un usuari.
    /// </summary>
    [HttpPost("{userId:guid}/deactivate")]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> Deactivate(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setUserActiveStatusHandler.HandleAsync(userId, false, cancellationToken);
            return Ok(new ApiEnvelope<UserDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
        }
    }

    /// <summary>
    /// Reenvia la invitacio d un usuari.
    /// </summary>
    [HttpPost("{userId:guid}/resend-invite")]
    public async Task<ActionResult<ApiEnvelope<UserDto>>> ResendInvite(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _resendUserInviteHandler.HandleAsync(userId, cancellationToken);
            return Ok(new ApiEnvelope<UserDto>(true, result, "Invite re-sent."));
        }
        catch (Exception exception)
        {
            return ToErrorResult<UserDto>(exception);
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
            UserProvisioningException provisioningException => StatusCode(
                StatusCodes.Status502BadGateway,
                new ApiEnvelope<T>(false, default, provisioningException.Message, "provisioning_failed")),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error")),
        };
}

public sealed class CreateUserRequest
{
    /// <summary>
    /// Email final de l usuari. Es valida com a email real.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Codi intern opcional de l usuari.
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Nom visible de l usuari.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Client de l usuari. Serveix com a context de propietat, no com a dada de provisioning d autenticacio.
    /// </summary>
    public Guid? ClientId { get; set; }

    /// <summary>
    /// Rol existent que s assignara al nou usuari.
    /// </summary>
    public Guid RoleId { get; set; }

    /// <summary>
    /// Estat actiu inicial del registre local.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Defineix si l usuari es provisiona per invitacio o amb password directe.
    /// </summary>
    public UserProvisioningRequest Provisioning { get; set; } = new();

    public CreateUserCommand ToCommand()
        => new(Email, Code, Name, ClientId, RoleId, IsActive, Provisioning.ToOptions());
}

public sealed class UpdateUserRequest
{
    public string? Email { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public Guid? RoleId { get; set; }
    public bool? IsActive { get; set; }

    public UpdateUserCommand ToCommand(Guid clientId, Guid userId)
        => new(clientId, userId, Email, Code, Name, RoleId, IsActive);
}

public sealed class UserProvisioningRequest
{
    /// <summary>
    /// Mode de provisioning.
    /// invite envia un enllac d invitacio i no garanteix login immediat amb email i password.
    /// password crea l usuari amb el flux admin de Supabase i es l unic mode que pot habilitar login directe amb email i password.
    /// </summary>
    public string Mode { get; set; } = UserProvisioningModes.Invite;

    /// <summary>
    /// Password nomes valida per al mode password.
    /// Si s envia amb mode invite, la peticio es rebutja.
    /// </summary>
    public string? Password { get; set; }

    public UserProvisioningOptions ToOptions()
        => new(Mode, Password);
}
