using System.Text.RegularExpressions;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Common;
using GreenLytics.V3.Domain.Entities;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GreenLytics.V3.Application.Clients;

public sealed class ClientManagementValidationService
{
    private static readonly Regex ClientCodeRegex = new("^[A-Z0-9][A-Z0-9_-]{0,49}$", RegexOptions.Compiled);

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUser;

    public ClientManagementValidationService(IAppDbContext dbContext, ICurrentUserAccessor currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<ValidatedClientScope> ValidateReadAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        ClientManagementPolicy.RequireCanViewClients(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);

        if (!ClientManagementPolicy.IsAdmin(_currentUser))
        {
            clientId = currentClientId;
        }

        var client = await _dbContext.Clients
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);

        if (client is null)
        {
            throw new EntityNotFoundException("The requested client was not found.");
        }

        return new ValidatedClientScope(client);
    }

    public async Task<ValidatedCreateClientRequest> ValidateCreateAsync(CreateClientCommand command, CancellationToken cancellationToken = default)
    {
        ClientManagementPolicy.RequireCanManageClients(_currentUser);

        var code = NormalizeCode(command.Code);
        var name = RequireName(command.Name);

        var duplicateExists = await _dbContext.Clients
            .AnyAsync(x => !x.IsDeleted && x.Code == code, cancellationToken);

        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                $"Client with code '{code}' already exists.",
                RequestValidationException.Field("code", "duplicate", $"Client with code '{code}' already exists."));
        }

        return new ValidatedCreateClientRequest(
            code,
            name,
            NormalizeOptional(command.Description, "description", 1000),
            command.IsActive);
    }

    public async Task<ValidatedUpdateClientRequest> ValidateUpdateAsync(UpdateClientCommand command, CancellationToken cancellationToken = default)
    {
        ClientManagementPolicy.RequireCanManageClients(_currentUser);

        var client = await _dbContext.Clients
            .SingleOrDefaultAsync(x => x.Id == command.ClientId && !x.IsDeleted, cancellationToken);

        if (client is null)
        {
            throw new EntityNotFoundException("The requested client was not found.");
        }

        var code = NormalizeCode(command.Code);
        var name = RequireName(command.Name);

        var duplicateExists = await _dbContext.Clients
            .AnyAsync(x => !x.IsDeleted && x.Code == code && x.Id != client.Id, cancellationToken);

        if (duplicateExists)
        {
            throw RequestValidationException.Conflict(
                $"Client with code '{code}' already exists.",
                RequestValidationException.Field("code", "duplicate", $"Client with code '{code}' already exists."));
        }

        return new ValidatedUpdateClientRequest(
            client,
            code,
            name,
            NormalizeOptional(command.Description, "description", 1000),
            command.IsActive);
    }

    public async Task<ValidatedClientStatusChange> ValidateStatusChangeAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        ClientManagementPolicy.RequireCanManageClients(_currentUser);

        var client = await _dbContext.Clients
            .SingleOrDefaultAsync(x => x.Id == clientId && !x.IsDeleted, cancellationToken);

        if (client is null)
        {
            throw new EntityNotFoundException("The requested client was not found.");
        }

        return new ValidatedClientStatusChange(client);
    }

    public Task<ValidatedClientsSearchRequest> ValidateSearchAsync(ClientsSearchRequest request, CancellationToken cancellationToken = default)
    {
        ClientManagementPolicy.RequireCanViewClients(_currentUser);
        var currentClientId = CurrentUserAuthorization.RequireClientScope(_currentUser);
        var filters = request.Filters ?? new ClientSearchFilters(null, null, null, null, null);

        SearchRequestValidation.EnsureDateRange(filters.CreatedAtFrom, filters.CreatedAtTo, "filters.createdAtFrom", "filters.createdAtTo");

        return Task.FromResult(new ValidatedClientsSearchRequest(
            ClientManagementPolicy.IsAdmin(_currentUser) ? null : currentClientId,
            NormalizeCodeOptional(filters.Code),
            NormalizeOptional(filters.Name, "filters.name", 150),
            filters.IsActive,
            filters.CreatedAtFrom,
            filters.CreatedAtTo,
            SearchRequestValidation.NormalizePagination(request.Pagination),
            SearchRequestValidation.NormalizeSort(request.Sort, "createdAt", "code", "name", "createdAt")));
    }

    private static string RequireName(string input)
    {
        var normalized = NormalizeOptional(input, "name", 150);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Client name is required.",
                RequestValidationException.Field("name", "required", "Client name is required."));
        }

        return normalized;
    }

    private static string NormalizeCode(string input)
    {
        var normalized = NormalizeCodeOptional(input);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Client code is required.",
                RequestValidationException.Field("code", "required", "Client code is required."));
        }

        return normalized;
    }

    private static string? NormalizeCodeOptional(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = Regex.Replace(input.Trim().ToUpperInvariant(), "\\s+", "-");
        if (!ClientCodeRegex.IsMatch(normalized))
        {
            throw RequestValidationException.BadRequest(
                "Client code contains unsupported characters. Use only letters, numbers, hyphen and underscore.",
                RequestValidationException.Field("code", "invalid_format", "Client code contains unsupported characters. Use only letters, numbers, hyphen and underscore."));
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? input, string field, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var normalized = input.Trim();
        if (normalized.Length > maxLength)
        {
            throw RequestValidationException.BadRequest(
                $"{field} exceeds the maximum allowed length of {maxLength} characters.",
                RequestValidationException.Field(field, "max_length", $"{field} exceeds the maximum allowed length of {maxLength} characters."));
        }

        return normalized;
    }
}

public sealed record ValidatedClientScope(
    Client Client
);

public sealed record ValidatedCreateClientRequest(
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record ValidatedUpdateClientRequest(
    Client Client,
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record ValidatedClientStatusChange(
    Client Client
);

public sealed record ValidatedClientsSearchRequest(
    Guid? ForcedClientId,
    string? Code,
    string? Name,
    bool? IsActive,
    DateTime? CreatedAtFrom,
    DateTime? CreatedAtTo,
    GreenLytics.V3.Shared.Contracts.SearchPagination Pagination,
    NormalizedSort Sort
);
