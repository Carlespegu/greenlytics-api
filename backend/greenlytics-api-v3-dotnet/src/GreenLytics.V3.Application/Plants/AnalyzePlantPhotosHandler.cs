using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Application.Photos;

namespace GreenLytics.V3.Application.Plants;

public sealed class AnalyzePlantPhotosHandler
{
    private readonly PlantManagementValidationService _validationService;
    private readonly PhotoRequestValidationService _photoValidationService;
    private readonly IPlantAnalysisService _plantAnalysisService;

    public AnalyzePlantPhotosHandler(
        PlantManagementValidationService validationService,
        PhotoRequestValidationService photoValidationService,
        IPlantAnalysisService plantAnalysisService)
    {
        _validationService = validationService;
        _photoValidationService = photoValidationService;
        _plantAnalysisService = plantAnalysisService;
    }

    public async Task<AnalyzePlantPhotosDto> HandleAsync(AnalyzePlantPhotosCommand command, CancellationToken cancellationToken = default)
    {
        await _validationService.ValidateAnalyzePhotosAsync(command.ClientId, cancellationToken);

        var validatedPhotos = _photoValidationService.ValidatePhotos(
            new Dictionary<string, PlantPhotoPayload>(StringComparer.OrdinalIgnoreCase)
            {
                ["leaf"] = command.LeafPhoto,
                ["trunk"] = command.TrunkPhoto,
                ["general"] = command.GeneralPhoto,
            },
            requireAllPhotos: true,
            requireAtLeastOnePhoto: true);

        var photoSet = new RequiredPlantPhotoSet(
            validatedPhotos["leaf"] with { PhotoPart = "leaf" },
            validatedPhotos["trunk"] with { PhotoPart = "trunk" },
            validatedPhotos["general"] with { PhotoPart = "general" });

        var analysis = await _plantAnalysisService.AnalyzeAsync(
            photoSet,
            NormalizeLanguage(command.LanguageCode),
            cancellationToken);

        return new AnalyzePlantPhotosDto(
            analysis.SpeciesName,
            analysis.Confidence,
            analysis.HealthStatus,
            analysis.Observations,
            analysis.PossibleIssues,
            analysis.CareRecommendations);
    }

    private static string NormalizeLanguage(string? languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
        {
            return "ca";
        }

        return languageCode.Trim().ToLowerInvariant() switch
        {
            "ca" => "ca",
            "es" => "es",
            "en" => "en",
            _ => "ca",
        };
    }
}
