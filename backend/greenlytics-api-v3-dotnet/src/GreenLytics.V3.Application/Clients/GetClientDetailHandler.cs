namespace GreenLytics.V3.Application.Clients;

public sealed class GetClientDetailHandler
{
    private readonly ClientManagementValidationService _validationService;

    public GetClientDetailHandler(ClientManagementValidationService validationService)
    {
        _validationService = validationService;
    }

    public async Task<ClientDto> HandleAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        var validated = await _validationService.ValidateReadAsync(clientId, cancellationToken);
        return validated.Client.ToDto();
    }
}
