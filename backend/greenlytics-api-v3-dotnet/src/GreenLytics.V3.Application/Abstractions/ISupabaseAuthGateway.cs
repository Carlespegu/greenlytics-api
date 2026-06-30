using GreenLytics.V3.Application.Auth;

namespace GreenLytics.V3.Application.Abstractions;

public interface ISupabaseAuthGateway
{
    Task<SupabaseAuthTokens> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<SupabaseAuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task SendPasswordRecoveryEmailAsync(string email, string? redirectTo = null, CancellationToken cancellationToken = default);
    Task UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken cancellationToken = default);
    Task<SupabaseProvisionedUser> CreateUserWithPasswordAsync(SupabaseAdminCreateUserRequest request, CancellationToken cancellationToken = default);
    Task<SupabaseProvisionedUser> InviteUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<SupabaseProvisionedUser> UpdateUserAsync(Guid userId, SupabaseAdminUpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
