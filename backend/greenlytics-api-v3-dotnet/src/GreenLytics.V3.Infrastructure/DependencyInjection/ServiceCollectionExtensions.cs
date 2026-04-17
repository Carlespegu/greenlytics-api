using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Alerts;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Application.Clients;
using GreenLytics.V3.Application.Devices;
using GreenLytics.V3.Application.Installations;
using GreenLytics.V3.Application.Plants;
using GreenLytics.V3.Application.Readings;
using GreenLytics.V3.Application.TableMetadata;
using GreenLytics.V3.Application.Users;
using GreenLytics.V3.Infrastructure.Authentication;
using GreenLytics.V3.Infrastructure.OpenAi;
using GreenLytics.V3.Infrastructure.Persistence;
using GreenLytics.V3.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GreenLytics.V3.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddGreenLyticsInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = GetFirstConfiguredValue(
                configuration.GetConnectionString("DefaultConnection"),
                configuration["Database:ConnectionString"])
            ?? throw new InvalidOperationException("Database connection string is missing.");

        services.Configure<SupabaseAuthenticationOptions>(configuration.GetSection(SupabaseAuthenticationOptions.SectionName));
        services.Configure<RefreshTokenOptions>(configuration.GetSection(RefreshTokenOptions.SectionName));
        services.Configure<SessionOptions>(configuration.GetSection(SessionOptions.SectionName));
        services.Configure<OpenAiOptions>(configuration.GetSection(OpenAiOptions.SectionName));

        services.AddDbContext<GreenLyticsDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<GreenLyticsDbContext>());
        services.AddScoped<IClock, SystemClock>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();
        services.AddScoped<ICurrentUser>(provider => provider.GetRequiredService<ICurrentUserAccessor>());
        services.AddScoped<IAuthenticationSettings, AuthenticationSettings>();
        services.AddSingleton<IDeviceSecretService, DeviceSecretService>();
        services.AddScoped<IUserSessionValidator, UserSessionValidator>();
        services.AddHttpClient<ISupabaseAuthGateway, SupabaseAuthGateway>((provider, client) =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<SupabaseAuthenticationOptions>>().Value;
            client.BaseAddress = new Uri($"{options.Url.TrimEnd('/')}/auth/v1/");
        });

        services.AddScoped<CreatePlantHandler>();
        services.AddScoped<UpdatePlantHandler>();
        services.AddScoped<DeletePlantHandler>();
        services.AddScoped<AlertManagementValidationService>();
        services.AddScoped<GetAlertDetailHandler>();
        services.AddScoped<SearchAlertsHandler>();
        services.AddScoped<CreateAlertHandler>();
        services.AddScoped<UpdateAlertHandler>();
        services.AddScoped<SetAlertActiveStatusHandler>();
        services.AddScoped<PlantManagementValidationService>();
        services.AddScoped<GetPlantDetailHandler>();
        services.AddScoped<SearchPlantsHandler>();
        services.AddScoped<ListPlantPhotosHandler>();
        services.AddScoped<CreatePlantPhotoHandler>();
        services.AddScoped<SetPlantPhotoPrimaryHandler>();
        services.AddScoped<DeletePlantPhotoHandler>();
        services.AddScoped<ListPlantThresholdsHandler>();
        services.AddScoped<CreatePlantThresholdHandler>();
        services.AddScoped<UpdatePlantThresholdHandler>();
        services.AddScoped<DeletePlantThresholdHandler>();
        services.AddScoped<ListPlantEventsHandler>();
        services.AddScoped<CreatePlantEventHandler>();
        services.AddScoped<UpdatePlantEventHandler>();
        services.AddScoped<DeletePlantEventHandler>();
        services.AddScoped<GetTableFieldMetadataHandler>();
        services.AddScoped<ClientManagementValidationService>();
        services.AddScoped<GetClientDetailHandler>();
        services.AddScoped<SearchClientsHandler>();
        services.AddScoped<CreateClientHandler>();
        services.AddScoped<UpdateClientHandler>();
        services.AddScoped<SetClientActiveStatusHandler>();
        services.AddScoped<DeviceManagementValidationService>();
        services.AddScoped<GetDeviceDetailHandler>();
        services.AddScoped<SearchDevicesHandler>();
        services.AddScoped<CreateDeviceHandler>();
        services.AddScoped<UpdateDeviceHandler>();
        services.AddScoped<DeleteDeviceHandler>();
        services.AddScoped<SetDeviceActiveStatusHandler>();
        services.AddScoped<RotateDeviceSecretHandler>();
        services.AddScoped<InstallationManagementValidationService>();
        services.AddScoped<GetInstallationDetailHandler>();
        services.AddScoped<SearchInstallationsHandler>();
        services.AddScoped<CreateInstallationHandler>();
        services.AddScoped<UpdateInstallationHandler>();
        services.AddScoped<DeleteInstallationHandler>();
        services.AddScoped<SetInstallationActiveStatusHandler>();
        services.AddScoped<DeviceReadingsValidationService>();
        services.AddScoped<IngestDeviceReadingsHandler>();
        services.AddScoped<GetLatestDeviceReadingHandler>();
        services.AddScoped<GetDeviceReadingHistoryHandler>();
        services.AddScoped<ReadingsManagementValidationService>();
        services.AddScoped<SearchReadingsHandler>();
        services.AddScoped<GetReadingsTimeseriesHandler>();
        services.AddScoped<UserManagementValidationService>();
        services.AddScoped<CreateUserHandler>();
        services.AddScoped<SearchUsersHandler>();
        services.AddScoped<GetUserDetailHandler>();
        services.AddScoped<UpdateUserHandler>();
        services.AddScoped<SetUserActiveStatusHandler>();
        services.AddScoped<ResendUserInviteHandler>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<RefreshTokenHandler>();
        services.AddScoped<LogoutHandler>();
        services.AddScoped<GetCurrentUserHandler>();

        return services;
    }

    private static string? GetFirstConfiguredValue(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}


