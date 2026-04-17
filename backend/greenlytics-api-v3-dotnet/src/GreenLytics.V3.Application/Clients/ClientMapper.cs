using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Clients;

public static class ClientMapper
{
    public static ClientDto ToDto(this Client client)
        => new(
            client.Id,
            client.Code,
            client.Name,
            client.Description,
            client.IsActive,
            client.CreatedAt,
            client.CreatedByUserId,
            client.UpdatedAt,
            client.UpdatedByUserId);
}
