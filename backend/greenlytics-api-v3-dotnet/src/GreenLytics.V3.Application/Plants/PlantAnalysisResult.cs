namespace GreenLytics.V3.Application.Plants;

public sealed record PlantAnalysisResult(
    string? SpeciesName,
    decimal? Confidence,
    string? HealthStatus,
    string? Observations,
    IReadOnlyList<string> PossibleIssues,
    IReadOnlyList<string> CareRecommendations
);
