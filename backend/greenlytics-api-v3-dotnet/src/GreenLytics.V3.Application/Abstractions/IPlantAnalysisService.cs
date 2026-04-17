using GreenLytics.V3.Application.Plants;

namespace GreenLytics.V3.Application.Abstractions;

public interface IPlantAnalysisService
{
    Task<PlantAnalysisResult> AnalyzeAsync(
        RequiredPlantPhotoSet photoSet,
        string languageCode,
        CancellationToken cancellationToken = default);
}
