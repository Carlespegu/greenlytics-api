namespace GreenLytics.V3.Application.Auth;

public sealed record SupabaseAdminCreateUserRequest(
    string Email,
    string? Password,
    string? Name,
    string? Code,
    bool EmailConfirmed
);

public sealed record SupabaseAdminUpdateUserRequest(
    string? Email,
    string? Password,
    string? Name,
    string? Code,
    bool? EmailConfirmed
);

public sealed record SupabaseProvisionedUser(
    Guid Id,
    string Email
);
