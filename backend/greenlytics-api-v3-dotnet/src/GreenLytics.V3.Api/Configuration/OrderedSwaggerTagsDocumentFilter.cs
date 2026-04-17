using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace GreenLytics.V3.Api.Configuration;

public sealed class OrderedSwaggerTagsDocumentFilter : IDocumentFilter
{
    private static readonly string[] PreferredOrder =
    {
        "Auth",
        "Clients",
        "Users",
        "Installations",
        "Devices",
        "Plants",
        "Readings",
    };

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var tagNames = swaggerDoc.Paths.Values
            .SelectMany(pathItem => pathItem.Operations.Values)
            .SelectMany(operation => operation.Tags ?? Enumerable.Empty<OpenApiTag>())
            .Select(tag => tag.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var orderedPreferred = PreferredOrder
            .Where(preferred => tagNames.Contains(preferred, StringComparer.OrdinalIgnoreCase))
            .Select(name => new OpenApiTag { Name = name });

        var remaining = tagNames
            .Where(name => !PreferredOrder.Contains(name, StringComparer.OrdinalIgnoreCase))
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .Select(name => new OpenApiTag { Name = name });

        swaggerDoc.Tags = orderedPreferred
            .Concat(remaining)
            .ToList();
    }
}
