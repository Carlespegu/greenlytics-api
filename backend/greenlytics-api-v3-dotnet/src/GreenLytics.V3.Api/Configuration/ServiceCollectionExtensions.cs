using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using GreenLytics.V3.Application.Auth;
using GreenLytics.V3.Infrastructure.Authentication;
using Microsoft.OpenApi.Models;

namespace GreenLytics.V3.Api.Configuration;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPublicApi(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SupabaseAuthenticationOptions>(configuration.GetSection(SupabaseAuthenticationOptions.SectionName));
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            var xmlFile = $"{typeof(Program).Assembly.GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }

            options.DocumentFilter<OrderedSwaggerTagsDocumentFilter>();

            options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = JwtBearerDefaults.AuthenticationScheme,
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enganxa nomes el JWT. Swagger ja afegeix automaticament el prefix Bearer.",
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = JwtBearerDefaults.AuthenticationScheme,
                        },
                    },
                    Array.Empty<string>()
                },
            });
        });
        services.AddScoped<SupabaseJwtBearerEvents>();

        services.AddCors(options =>
        {
            options.AddPolicy("PublicClients", policy =>
            {
                policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
            });
        });

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var supabaseOptions = configuration.GetSection(SupabaseAuthenticationOptions.SectionName).Get<SupabaseAuthenticationOptions>()
                    ?? throw new InvalidOperationException("Authentication:Supabase configuration is missing.");

                options.RequireHttpsMetadata = supabaseOptions.RequireHttpsMetadata;
                options.MetadataAddress = supabaseOptions.OpenIdConfigurationUrl;
                options.MapInboundClaims = false;
                options.EventsType = typeof(SupabaseJwtBearerEvents);
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = supabaseOptions.ResolvedJwtIssuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(supabaseOptions.JwtAudience),
                    ValidAudience = supabaseOptions.JwtAudience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    NameClaimType = AuthClaimTypes.Email,
                    RoleClaimType = AuthClaimTypes.RoleCode,
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.Authenticated, policy => policy.RequireAuthenticatedUser());
            options.AddPolicy(AuthorizationPolicies.AdminOnly, policy => policy.RequireRole(RoleCodes.Admin));
            options.AddPolicy(AuthorizationPolicies.AdminOrManager, policy => policy.RequireRole(RoleCodes.Admin, RoleCodes.Manager));
        });
        return services;
    }
}
