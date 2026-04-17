using GreenLytics.V3.Api.Configuration;
using GreenLytics.V3.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

var legacySettings = new Dictionary<string, string?>();

MapLegacySetting("Database:ConnectionString", "DATABASE_URL");
MapLegacySetting("Authentication:Supabase:Url", "SUPABASE_URL");
MapLegacySetting("Authentication:Supabase:ApiKey", "SUPABASE_API_KEY", "SUPABASE_SERVICE_ROLE_KEY");
MapLegacySetting("Authentication:Supabase:ServiceRoleKey", "SUPABASE_SERVICE_ROLE_KEY");
MapLegacySetting("Supabase:Url", "SUPABASE_URL");
MapLegacySetting("Supabase:ServiceRoleKey", "SUPABASE_SERVICE_ROLE_KEY");
MapLegacySetting("Supabase:Bucket", "SUPABASE_STORAGE_BUCKET");
MapLegacySetting("OpenAI:ApiKey", "OPENAI_API_KEY");
MapLegacySetting("OpenAI:Model", "OPENAI_MODEL");

if (legacySettings.Count > 0)
{
    builder.Configuration.AddInMemoryCollection(legacySettings);
}

var renderPort = Environment.GetEnvironmentVariable("PORT");
if (int.TryParse(renderPort, out var port) && port > 0)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services
    .AddPublicApi(builder.Configuration)
    .AddGreenLyticsInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("PublicClients");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Ok(new { message = "GreenLytics V3 API is running", version = "3.0.0-preview" }));

app.Run();

void MapLegacySetting(string configurationKey, params string[] environmentVariableNames)
{
    if (!string.IsNullOrWhiteSpace(builder.Configuration[configurationKey]))
    {
        return;
    }

    foreach (var environmentVariableName in environmentVariableNames)
    {
        var value = Environment.GetEnvironmentVariable(environmentVariableName);
        if (!string.IsNullOrWhiteSpace(value))
        {
            legacySettings[configurationKey] = value;
            return;
        }
    }
}
