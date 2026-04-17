using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Plants;
using GreenLytics.V3.Infrastructure.OpenAi;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenLytics.V3.Infrastructure.Services;

public sealed class OpenAiPlantAnalysisService : IPlantAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly OpenAiOptions _options;
    private readonly ILogger<OpenAiPlantAnalysisService> _logger;

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public OpenAiPlantAnalysisService(
        HttpClient httpClient,
        IOptions<OpenAiOptions> options,
        ILogger<OpenAiPlantAnalysisService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<PlantAnalysisResult> AnalyzeAsync(
        RequiredPlantPhotoSet photoSet,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new PlantAnalysisFailedException("Plant analysis service is not configured.");
        }

        var contentItems = BuildContentItems(photoSet, languageCode);
        if (contentItems.Count <= 1)
        {
            return CreateFallbackResult("No valid plant images were provided.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "responses");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = _options.Model,
            input = new[]
            {
                new
                {
                    role = "user",
                    content = contentItems,
                },
            },
            text = new
            {
                format = new
                {
                    type = "json_schema",
                    name = "greenlytics_plant_analysis",
                    strict = true,
                    schema = BuildJsonSchema(),
                },
            },
        }, options: SerializerOptions);

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "openai.plant_analysis.http_error status_code={StatusCode} body={BodyExcerpt}",
                    (int)response.StatusCode,
                    Truncate(rawResponse, 600));
                throw new PlantAnalysisFailedException("Plant analysis is temporarily unavailable.");
            }

            return ParseResponse(rawResponse);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(exception, "openai.plant_analysis.timeout model={Model}", _options.Model);
            throw new PlantAnalysisFailedException("Plant analysis timed out. Please try again.", isTimeout: true);
        }
        catch (PlantAnalysisFailedException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "openai.plant_analysis.unexpected_failure model={Model}", _options.Model);
            throw new PlantAnalysisFailedException("Plant analysis is temporarily unavailable.");
        }
    }

    private List<object> BuildContentItems(RequiredPlantPhotoSet photoSet, string languageCode)
    {
        var items = new List<object>
        {
            new
            {
                type = "input_text",
                text = BuildPrompt(languageCode),
            },
        };

        AppendImage(items, "leaf", photoSet.Leaf);
        AppendImage(items, "trunk", photoSet.Trunk);
        AppendImage(items, "general", photoSet.General);

        return items;
    }

    private static void AppendImage(List<object> items, string part, PlantPhotoPayload payload)
    {
        if (payload.Content is null || payload.Content.Length == 0)
        {
            return;
        }

        items.Add(new
        {
            type = "input_text",
            text = $"{part} photo",
        });

        items.Add(new
        {
            type = "input_image",
            image_url = ToDataUrl(payload),
        });
    }

    private static string ToDataUrl(PlantPhotoPayload payload)
    {
        var mimeType = string.IsNullOrWhiteSpace(payload.MimeType) ? "image/jpeg" : payload.MimeType;
        var base64 = Convert.ToBase64String(payload.Content);
        return $"data:{mimeType};base64,{base64}";
    }

    private static object BuildJsonSchema()
        => new
        {
            type = "object",
            additionalProperties = false,
            required = new[]
            {
                "speciesScientificName",
                "speciesCommonName",
                "speciesConfidence",
                "healthStatus",
                "healthConfidence",
                "analysisQuality",
                "observations",
                "possibleIssues",
                "careRecommendations",
            },
            properties = new Dictionary<string, object?>
            {
                ["speciesScientificName"] = new
                {
                    type = new[] { "string", "null" },
                    description = "Normalized scientific name of the most probable species.",
                },
                ["speciesCommonName"] = new
                {
                    type = new[] { "string", "null" },
                    description = "Normalized common name in the requested response language.",
                },
                ["speciesConfidence"] = new
                {
                    type = new[] { "number", "null" },
                    minimum = 0,
                    maximum = 1,
                    description = "Confidence for species identification only.",
                },
                ["healthStatus"] = new
                {
                    type = "string",
                    @enum = new[] { "healthy", "warning", "critical", "unknown" },
                    description = "Visible health assessment.",
                },
                ["healthConfidence"] = new
                {
                    type = new[] { "number", "null" },
                    minimum = 0,
                    maximum = 1,
                    description = "Confidence for health assessment only.",
                },
                ["analysisQuality"] = new
                {
                    type = "string",
                    @enum = new[] { "high", "medium", "low" },
                    description = "Overall quality of the visual evidence.",
                },
                ["observations"] = new
                {
                    type = new[] { "string", "null" },
                    maxLength = 240,
                    description = "Short business-oriented summary of what is visible.",
                },
                ["possibleIssues"] = new
                {
                    type = "array",
                    items = new
                    {
                        type = "string",
                        @enum = new[]
                        {
                            "chlorosis",
                            "browning_tips",
                            "browning_edges",
                            "dry_soil",
                            "wet_soil",
                            "drooping",
                            "curled_leaves",
                            "torn_leaves",
                            "leaf_spots",
                            "pest_damage",
                            "mechanical_damage",
                            "low_confidence_identification",
                        },
                    },
                },
                ["careRecommendations"] = new
                {
                    type = "array",
                    items = new
                    {
                        type = "string",
                        @enum = new[]
                        {
                            "check_watering",
                            "reduce_watering",
                            "increase_watering_monitoring",
                            "improve_indirect_light",
                            "avoid_direct_sun",
                            "check_drainage",
                            "inspect_leaves",
                            "remove_damaged_leaves",
                            "monitor_evolution",
                        },
                    },
                },
            },
        };

    private static string BuildPrompt(string languageCode)
    {
        var languageName = ToLanguageName(languageCode);

        return $"""
You are the plant analysis assistant for GreenLytics.

You will receive up to three photos of the same plant, usually:
1. leaf close-up
2. stem/trunk close-up
3. general plant view

Analyze all available photos together as a single case.
Do not analyze each image independently unless necessary.

Your goal is to help a plant monitoring platform:
- identify the most likely plant species
- estimate visible health status
- detect only clearly visible issues
- suggest short initial care recommendations

Return only valid JSON that matches the required schema.
Do not return markdown.
Do not add explanations outside the JSON.
Do not include comments.

General rules:
1. Base the analysis only on visible evidence in the images.
2. Use visual cues such as leaf shape, venation, leaf arrangement, stem/trunk structure, growth habit, visible discoloration, visible damage, and visible soil surface condition.
3. Assume the plant is most likely a common ornamental indoor or terrace plant in a domestic environment unless the visual evidence strongly suggests otherwise.
4. Do not invent facts that are not visually supported.
5. Do not diagnose hidden causes such as root rot, nutrient deficiency, fungal disease, pests, or watering problems unless there are visible signs that strongly support them.
6. If evidence is weak, incomplete, blurred, overexposed, underexposed, or key plant parts are missing, reduce confidence and lower analysisQuality.
7. If species cannot be determined reliably, return a concise best estimate and lower confidence.
8. If visible health cannot be concluded reliably, set healthStatus to "unknown" and lower healthConfidence.
9. possibleIssues must include only visible or strongly visually supported issues.
10. careRecommendations must be short, practical, and conservative. If uncertain, return an empty array.
11. Avoid duplicates in arrays.
12. Keep observations concise, clear, and in the requested language only.
13. Use normalized labels exactly as defined by the schema for possibleIssues and careRecommendations.
14. If the identification is uncertain, include "low_confidence_identification" in possibleIssues.

Field rules:
- speciesScientificName: normalized scientific name when possible
- speciesCommonName: normalized common name in the requested language when possible
- speciesConfidence: confidence for species identification only
- healthStatus: must be one of healthy, warning, critical, unknown
- healthConfidence: confidence for visible health assessment only
- analysisQuality: high, medium, or low depending on visual quality and completeness
- observations: short business-oriented summary of what is visible
- possibleIssues: only normalized issue labels from the schema
- careRecommendations: only normalized recommendation labels from the schema
- If a field cannot be concluded, return null for nullable fields
- Keep arrays empty instead of guessing

Requested response language: {languageName}
""";
    }

    private static string ToLanguageName(string languageCode)
        => (languageCode ?? "ca").Trim().ToLowerInvariant() switch
        {
            "ca" => "Catalan",
            "es" => "Spanish",
            "en" => "English",
            _ => "Catalan",
        };

    private PlantAnalysisResult ParseResponse(string rawResponse)
    {
        using var document = JsonDocument.Parse(rawResponse);
        var root = document.RootElement;

        if (TryExtractParsedPayload(root, out var parsed))
        {
            return Normalize(parsed);
        }

        if (TryExtractOutputText(root, out var outputText) && !string.IsNullOrWhiteSpace(outputText))
        {
            try
            {
                var fromText = JsonSerializer.Deserialize<OpenAiPlantAnalysisPayload>(
                    ExtractJsonObject(outputText),
                    SerializerOptions);

                if (fromText is not null)
                {
                    return Normalize(fromText);
                }
            }
            catch (JsonException exception)
            {
                _logger.LogWarning(
                    exception,
                    "openai.plant_analysis.invalid_json body={BodyExcerpt}",
                    Truncate(outputText, 400));
            }
        }

        _logger.LogError("openai.plant_analysis.unparseable_response body={BodyExcerpt}", Truncate(rawResponse, 700));
        throw new PlantAnalysisFailedException("Plant analysis returned an invalid response.");
    }

    private static bool TryExtractParsedPayload(JsonElement root, out OpenAiPlantAnalysisPayload? payload)
    {
        payload = null;

        if (!root.TryGetProperty("output", out var output) || output.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (var item in output.EnumerateArray())
        {
            if (!item.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var part in content.EnumerateArray())
            {
                if (part.TryGetProperty("parsed", out var parsedElement))
                {
                    if (parsedElement.ValueKind == JsonValueKind.Object)
                    {
                        payload = JsonSerializer.Deserialize<OpenAiPlantAnalysisPayload>(
                            parsedElement.GetRawText(),
                            SerializerOptions);
                        return payload is not null;
                    }

                    if (parsedElement.ValueKind == JsonValueKind.String)
                    {
                        var parsedText = parsedElement.GetString();
                        if (string.IsNullOrWhiteSpace(parsedText))
                        {
                            continue;
                        }

                        payload = JsonSerializer.Deserialize<OpenAiPlantAnalysisPayload>(
                            parsedText,
                            SerializerOptions);
                        return payload is not null;
                    }
                }

                if (part.TryGetProperty("json", out var jsonElement) && jsonElement.ValueKind == JsonValueKind.Object)
                {
                    payload = JsonSerializer.Deserialize<OpenAiPlantAnalysisPayload>(
                        jsonElement.GetRawText(),
                        SerializerOptions);
                    return payload is not null;
                }
            }
        }

        return false;
    }

    private static bool TryExtractOutputText(JsonElement root, out string? outputText)
    {
        outputText = null;

        if (root.TryGetProperty("output_text", out var directText) && directText.ValueKind == JsonValueKind.String)
        {
            outputText = directText.GetString();
            return !string.IsNullOrWhiteSpace(outputText);
        }

        if (!root.TryGetProperty("output", out var output) || output.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (var item in output.EnumerateArray())
        {
            if (!item.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var part in content.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    outputText = textElement.GetString();
                    return !string.IsNullOrWhiteSpace(outputText);
                }
            }
        }

        return false;
    }

    private static string ExtractJsonObject(string outputText)
    {
        var cleaned = outputText.Trim();
        if (cleaned.StartsWith("```", StringComparison.Ordinal))
        {
            cleaned = cleaned.Replace("```json", string.Empty, StringComparison.OrdinalIgnoreCase)
                .Replace("```", string.Empty, StringComparison.OrdinalIgnoreCase)
                .Trim();
        }

        var firstBrace = cleaned.IndexOf('{');
        var lastBrace = cleaned.LastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace)
        {
            cleaned = cleaned.Substring(firstBrace, lastBrace - firstBrace + 1);
        }

        return cleaned;
    }

    private static PlantAnalysisResult Normalize(OpenAiPlantAnalysisPayload? payload)
    {
        if (payload is null)
        {
            return CreateFallbackResult("Plant analysis completed with limited data.");
        }

        return new PlantAnalysisResult(
            FirstNonEmpty(payload.SpeciesScientificName, payload.SpeciesCommonName),
            NormalizeConfidence(payload.SpeciesConfidence),
            NormalizeHealthStatus(payload.HealthStatus),
            NormalizeString(payload.Observations),
            NormalizeList(payload.PossibleIssues),
            NormalizeList(payload.CareRecommendations));
    }

    private static PlantAnalysisResult CreateFallbackResult(string observations)
        => new(
            null,
            null,
            "unknown",
            observations,
            Array.Empty<string>(),
            Array.Empty<string>());

    private static string? NormalizeString(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? FirstNonEmpty(params string?[] values)
        => values
            .Select(NormalizeString)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    private static decimal? NormalizeConfidence(decimal? confidence)
    {
        if (!confidence.HasValue)
        {
            return null;
        }

        return Math.Clamp(confidence.Value, 0m, 1m);
    }

    private static string? NormalizeHealthStatus(string? healthStatus)
    {
        if (string.IsNullOrWhiteSpace(healthStatus))
        {
            return "unknown";
        }

        var normalized = healthStatus.Trim().ToLowerInvariant();
        return normalized is "healthy" or "warning" or "critical" or "unknown"
            ? normalized
            : "unknown";
    }

    private static IReadOnlyList<string> NormalizeList(IReadOnlyList<string>? values)
        => values?
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray()
           ?? Array.Empty<string>();

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private sealed class OpenAiPlantAnalysisPayload
    {
        [JsonPropertyName("speciesScientificName")]
        public string? SpeciesScientificName { get; set; }

        [JsonPropertyName("speciesCommonName")]
        public string? SpeciesCommonName { get; set; }

        [JsonPropertyName("speciesConfidence")]
        public decimal? SpeciesConfidence { get; set; }

        [JsonPropertyName("healthStatus")]
        public string? HealthStatus { get; set; }

        [JsonPropertyName("healthConfidence")]
        public decimal? HealthConfidence { get; set; }

        [JsonPropertyName("analysisQuality")]
        public string? AnalysisQuality { get; set; }

        [JsonPropertyName("observations")]
        public string? Observations { get; set; }

        [JsonPropertyName("possibleIssues")]
        public IReadOnlyList<string>? PossibleIssues { get; set; }

        [JsonPropertyName("careRecommendations")]
        public IReadOnlyList<string>? CareRecommendations { get; set; }
    }
}
