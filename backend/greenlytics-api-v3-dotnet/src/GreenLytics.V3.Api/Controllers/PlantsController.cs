using GreenLytics.V3.Application.Plants;
using GreenLytics.V3.Application.Photos;
using GreenLytics.V3.Application.Abstractions;
using GreenLytics.V3.Shared.Contracts;
using GreenLytics.V3.Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GreenLytics.V3.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize(Policy = Application.Auth.AuthorizationPolicies.Authenticated)]
public sealed class PlantsController : ControllerBase
{
    private readonly SearchPlantsHandler _searchPlantsHandler;
    private readonly GetPlantDetailHandler _getPlantDetailHandler;
    private readonly CreatePlantHandler _createPlantHandler;
    private readonly AnalyzePlantPhotosHandler _analyzePlantPhotosHandler;
    private readonly UpdatePlantHandler _updatePlantHandler;
    private readonly DeletePlantHandler _deletePlantHandler;
    private readonly ListPlantPhotosHandler _listPlantPhotosHandler;
    private readonly CreatePlantPhotoHandler _createPlantPhotoHandler;
    private readonly IPhotoStorageService _photoStorageService;
    private readonly PhotoRequestValidationService _photoValidationService;
    private readonly SetPlantPhotoPrimaryHandler _setPlantPhotoPrimaryHandler;
    private readonly DeletePlantPhotoHandler _deletePlantPhotoHandler;
    private readonly ListPlantThresholdsHandler _listPlantThresholdsHandler;
    private readonly CreatePlantThresholdHandler _createPlantThresholdHandler;
    private readonly UpdatePlantThresholdHandler _updatePlantThresholdHandler;
    private readonly DeletePlantThresholdHandler _deletePlantThresholdHandler;
    private readonly ListPlantEventsHandler _listPlantEventsHandler;
    private readonly CreatePlantEventHandler _createPlantEventHandler;
    private readonly UpdatePlantEventHandler _updatePlantEventHandler;
    private readonly DeletePlantEventHandler _deletePlantEventHandler;

    public PlantsController(
        SearchPlantsHandler searchPlantsHandler,
        GetPlantDetailHandler getPlantDetailHandler,
        CreatePlantHandler createPlantHandler,
        AnalyzePlantPhotosHandler analyzePlantPhotosHandler,
        UpdatePlantHandler updatePlantHandler,
        DeletePlantHandler deletePlantHandler,
        ListPlantPhotosHandler listPlantPhotosHandler,
        CreatePlantPhotoHandler createPlantPhotoHandler,
        IPhotoStorageService photoStorageService,
        PhotoRequestValidationService photoValidationService,
        SetPlantPhotoPrimaryHandler setPlantPhotoPrimaryHandler,
        DeletePlantPhotoHandler deletePlantPhotoHandler,
        ListPlantThresholdsHandler listPlantThresholdsHandler,
        CreatePlantThresholdHandler createPlantThresholdHandler,
        UpdatePlantThresholdHandler updatePlantThresholdHandler,
        DeletePlantThresholdHandler deletePlantThresholdHandler,
        ListPlantEventsHandler listPlantEventsHandler,
        CreatePlantEventHandler createPlantEventHandler,
        UpdatePlantEventHandler updatePlantEventHandler,
        DeletePlantEventHandler deletePlantEventHandler)
    {
        _searchPlantsHandler = searchPlantsHandler;
        _getPlantDetailHandler = getPlantDetailHandler;
        _createPlantHandler = createPlantHandler;
        _analyzePlantPhotosHandler = analyzePlantPhotosHandler;
        _updatePlantHandler = updatePlantHandler;
        _deletePlantHandler = deletePlantHandler;
        _listPlantPhotosHandler = listPlantPhotosHandler;
        _createPlantPhotoHandler = createPlantPhotoHandler;
        _photoStorageService = photoStorageService;
        _photoValidationService = photoValidationService;
        _setPlantPhotoPrimaryHandler = setPlantPhotoPrimaryHandler;
        _deletePlantPhotoHandler = deletePlantPhotoHandler;
        _listPlantThresholdsHandler = listPlantThresholdsHandler;
        _createPlantThresholdHandler = createPlantThresholdHandler;
        _updatePlantThresholdHandler = updatePlantThresholdHandler;
        _deletePlantThresholdHandler = deletePlantThresholdHandler;
        _listPlantEventsHandler = listPlantEventsHandler;
        _createPlantEventHandler = createPlantEventHandler;
        _updatePlantEventHandler = updatePlantEventHandler;
        _deletePlantEventHandler = deletePlantEventHandler;
    }

    /// <summary>
    /// Cerca plantes amb filtres, paginacio i dades de context operatiu.
    /// </summary>
    [HttpPost("plants/search")]
    public async Task<ActionResult<ApiEnvelope<PagedResult<PlantListItemDto>>>> Search([FromBody] PlantsSearchRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _searchPlantsHandler.HandleAsync(request, cancellationToken);
            return Ok(new ApiEnvelope<PagedResult<PlantListItemDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PagedResult<PlantListItemDto>>(exception);
        }
    }

    /// <summary>
    /// Obte el detall d una planta dins del context d un client.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/plants/{plantId:guid}")]
    public async Task<ActionResult<ApiEnvelope<PlantDetailDto>>> GetById(Guid clientId, Guid plantId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getPlantDetailHandler.HandleAsync(clientId, plantId, cancellationToken);
            return Ok(new ApiEnvelope<PlantDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantDetailDto>(exception);
        }
    }

    /// <summary>
    /// Crea una planta nova dins del context d un client.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants")]
    [Consumes("application/json")]
    public async Task<ActionResult<ApiEnvelope<PlantDetailDto>>> Create(Guid clientId, [FromBody] CreatePlantRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createPlantHandler.HandleAsync(request.ToCommand(clientId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantDetailDto>(exception);
        }
    }

    /// <summary>
    /// Crea una planta nova i persisteix les fotos inicials en el seu historial.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiEnvelope<PlantDetailDto>>> CreateWithPhotos(Guid clientId, [FromForm] CreatePlantWithPhotosRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _createPlantHandler.HandleAsync(request.ToCommand(clientId), cancellationToken);

            var uploads = await request.ToPhotoUploadsAsync(cancellationToken);
            foreach (var upload in uploads)
            {
                await UploadPlantPhotoAsync(
                    clientId,
                    created.Id,
                    upload.Payload,
                    upload.PhotoPart,
                    upload.FileName,
                    upload.IsPrimary,
                    upload.PhotoTypeId,
                    upload.IsActive,
                    cancellationToken);
            }

            var result = await _getPlantDetailHandler.HandleAsync(clientId, created.Id, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantDetailDto>(exception);
        }
    }

    /// <summary>
    /// Analitza les 3 fotos requerides d una planta i retorna una proposta inicial amb IA.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants/analyze-photos")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiEnvelope<AnalyzePlantPhotosDto>>> AnalyzePhotos(
        Guid clientId,
        [FromForm] AnalyzePlantPhotosRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _analyzePlantPhotosHandler.HandleAsync(
                await request.ToCommandAsync(clientId, cancellationToken),
                cancellationToken);
            return Ok(new ApiEnvelope<AnalyzePlantPhotosDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<AnalyzePlantPhotosDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza parcialment una planta dins del context d un client.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/plants/{plantId:guid}")]
    public async Task<ActionResult<ApiEnvelope<PlantDetailDto>>> Update(Guid clientId, Guid plantId, [FromBody] UpdatePlantRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updatePlantHandler.HandleAsync(request.ToCommand(clientId, plantId), cancellationToken);
            return Ok(new ApiEnvelope<PlantDetailDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantDetailDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament una planta dins del context d un client.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/plants/{plantId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> Delete(Guid clientId, Guid plantId, CancellationToken cancellationToken)
    {
        try
        {
            await _deletePlantHandler.HandleAsync(new DeletePlantCommand(clientId, plantId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    /// <summary>
    /// Llista les fotos d una planta.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/plants/{plantId:guid}/photos")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<PlantPhotoDto>>>> ListPhotos(Guid clientId, Guid plantId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _listPlantPhotosHandler.HandleAsync(clientId, plantId, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<PlantPhotoDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<PlantPhotoDto>>(exception);
        }
    }

    /// <summary>
    /// Afegeix una foto a una planta.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants/{plantId:guid}/photos")]
    [Consumes("application/json")]
    public async Task<ActionResult<ApiEnvelope<PlantPhotoDto>>> AddPhoto(Guid clientId, Guid plantId, [FromBody] CreatePlantPhotoRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createPlantPhotoHandler.HandleAsync(request.ToCommand(clientId, plantId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantPhotoDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantPhotoDto>(exception);
        }
    }

    /// <summary>
    /// Puja una foto i l'afegeix a l'historial d'una planta.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants/{plantId:guid}/photos")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiEnvelope<PlantPhotoDto>>> UploadPhoto(Guid clientId, Guid plantId, [FromForm] UploadPlantPhotoRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var payload = await request.ToPayloadAsync(cancellationToken);
            var result = await UploadPlantPhotoAsync(
                clientId,
                plantId,
                payload,
                request.PhotoPart,
                request.FileName,
                request.IsPrimary,
                request.PhotoTypeId,
                request.IsActive,
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantPhotoDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantPhotoDto>(exception);
        }
    }

    /// <summary>
    /// Marca una foto com a principal i desmarca la principal anterior.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/plants/{plantId:guid}/photos/{photoId:guid}/set-primary")]
    public async Task<ActionResult<ApiEnvelope<PlantPhotoDto>>> SetPrimaryPhoto(Guid clientId, Guid plantId, Guid photoId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _setPlantPhotoPrimaryHandler.HandleAsync(new SetPlantPhotoPrimaryCommand(clientId, plantId, photoId), cancellationToken);
            return Ok(new ApiEnvelope<PlantPhotoDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantPhotoDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament una foto d una planta.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/plants/{plantId:guid}/photos/{photoId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> DeletePhoto(Guid clientId, Guid plantId, Guid photoId, CancellationToken cancellationToken)
    {
        try
        {
            await _deletePlantPhotoHandler.HandleAsync(new DeletePlantPhotoCommand(clientId, plantId, photoId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    /// <summary>
    /// Llista els llindars configurats d una planta.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/plants/{plantId:guid}/thresholds")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<PlantThresholdDto>>>> ListThresholds(Guid clientId, Guid plantId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _listPlantThresholdsHandler.HandleAsync(clientId, plantId, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<PlantThresholdDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<PlantThresholdDto>>(exception);
        }
    }

    /// <summary>
    /// Crea un llindar nou per a una planta.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants/{plantId:guid}/thresholds")]
    public async Task<ActionResult<ApiEnvelope<PlantThresholdDto>>> CreateThreshold(Guid clientId, Guid plantId, [FromBody] CreatePlantThresholdRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createPlantThresholdHandler.HandleAsync(request.ToCommand(clientId, plantId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantThresholdDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantThresholdDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza parcialment un llindar d una planta.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/plants/{plantId:guid}/thresholds/{thresholdId:guid}")]
    public async Task<ActionResult<ApiEnvelope<PlantThresholdDto>>> UpdateThreshold(Guid clientId, Guid plantId, Guid thresholdId, [FromBody] UpdatePlantThresholdRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updatePlantThresholdHandler.HandleAsync(request.ToCommand(clientId, plantId, thresholdId), cancellationToken);
            return Ok(new ApiEnvelope<PlantThresholdDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantThresholdDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament un llindar d una planta.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/plants/{plantId:guid}/thresholds/{thresholdId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> DeleteThreshold(Guid clientId, Guid plantId, Guid thresholdId, CancellationToken cancellationToken)
    {
        try
        {
            await _deletePlantThresholdHandler.HandleAsync(new DeletePlantThresholdCommand(clientId, plantId, thresholdId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    /// <summary>
    /// Llista els esdeveniments de negoci d una planta.
    /// </summary>
    [HttpGet("clients/{clientId:guid}/plants/{plantId:guid}/events")]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyList<PlantEventDto>>>> ListEvents(Guid clientId, Guid plantId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _listPlantEventsHandler.HandleAsync(clientId, plantId, cancellationToken);
            return Ok(new ApiEnvelope<IReadOnlyList<PlantEventDto>>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<IReadOnlyList<PlantEventDto>>(exception);
        }
    }

    /// <summary>
    /// Crea un esdeveniment de negoci per a una planta.
    /// </summary>
    [HttpPost("clients/{clientId:guid}/plants/{plantId:guid}/events")]
    public async Task<ActionResult<ApiEnvelope<PlantEventDto>>> CreateEvent(Guid clientId, Guid plantId, [FromBody] CreatePlantEventRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createPlantEventHandler.HandleAsync(request.ToCommand(clientId, plantId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new ApiEnvelope<PlantEventDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantEventDto>(exception);
        }
    }

    /// <summary>
    /// Actualitza parcialment un esdeveniment de negoci d una planta.
    /// </summary>
    [HttpPut("clients/{clientId:guid}/plants/{plantId:guid}/events/{eventId:guid}")]
    public async Task<ActionResult<ApiEnvelope<PlantEventDto>>> UpdateEvent(Guid clientId, Guid plantId, Guid eventId, [FromBody] UpdatePlantEventRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _updatePlantEventHandler.HandleAsync(request.ToCommand(clientId, plantId, eventId), cancellationToken);
            return Ok(new ApiEnvelope<PlantEventDto>(true, result));
        }
        catch (Exception exception)
        {
            return ToErrorResult<PlantEventDto>(exception);
        }
    }

    /// <summary>
    /// Elimina logicament un esdeveniment de negoci d una planta.
    /// </summary>
    [HttpDelete("clients/{clientId:guid}/plants/{plantId:guid}/events/{eventId:guid}")]
    public async Task<ActionResult<ApiEnvelope<object>>> DeleteEvent(Guid clientId, Guid plantId, Guid eventId, CancellationToken cancellationToken)
    {
        try
        {
            await _deletePlantEventHandler.HandleAsync(new DeletePlantEventCommand(clientId, plantId, eventId), cancellationToken);
            return Ok(new ApiEnvelope<object>(true, null));
        }
        catch (Exception exception)
        {
            return ToErrorResult<object>(exception);
        }
    }

    private ActionResult<ApiEnvelope<T>> ToErrorResult<T>(Exception exception)
        => exception switch
        {
            RequestValidationException validationException => StatusCode(
                validationException.StatusCode,
                new ApiEnvelope<T>(false, default, validationException.Message, validationException.ErrorCode, validationException.Errors)),
            ForbiddenOperationException forbiddenException => StatusCode(
                StatusCodes.Status403Forbidden,
                new ApiEnvelope<T>(
                    false,
                    default,
                    forbiddenException.Message,
                    "forbidden",
                    new[]
                    {
                        new ValidationError("clientId", "invalid_scope", forbiddenException.Message)
                    })),
            UnauthorizedAccessException unauthorizedException => StatusCode(
                StatusCodes.Status401Unauthorized,
                new ApiEnvelope<T>(false, default, unauthorizedException.Message, "unauthorized")),
            PlantAnalysisFailedException analysisException => StatusCode(
                analysisException.IsTimeout ? StatusCodes.Status504GatewayTimeout : StatusCodes.Status503ServiceUnavailable,
                new ApiEnvelope<T>(false, default, analysisException.Message, "plant_analysis_unavailable")),
            EntityNotFoundException notFoundException => NotFound(
                new ApiEnvelope<T>(false, default, notFoundException.Message, "not_found")),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ApiEnvelope<T>(false, default, "An unexpected error occurred.", "internal_error"))
        };

    private static string NormalizePhotoPart(string? value)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? "photo" : value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "leaf" => "leaf",
            "stem" => "stem",
            "trunk" => "trunk",
            "general" => "general",
            _ => "photo"
        };
    }

    private async Task<PlantPhotoDto> UploadPlantPhotoAsync(
        Guid clientId,
        Guid plantId,
        PlantPhotoPayload payload,
        string? photoPart,
        string? fileName,
        bool isPrimary,
        Guid? photoTypeId,
        bool? isActive,
        CancellationToken cancellationToken)
    {
        var validated = _photoValidationService.ValidatePhotos(
            new Dictionary<string, PlantPhotoPayload>(StringComparer.OrdinalIgnoreCase)
            {
                [photoPart ?? "photo"] = payload
            },
            requireAllPhotos: true,
            requireAtLeastOnePhoto: true).Single().Value;

        var extension = Path.GetExtension(validated.FileName);
        var safePart = NormalizePhotoPart(photoPart);
        var storagePath = $"clients/{clientId}/plants/{plantId}/{Guid.NewGuid():N}-{safePart}{extension.ToLowerInvariant()}";

        await using var stream = new MemoryStream(validated.Content);
        var fileUrl = await _photoStorageService.UploadAsync(storagePath, stream, validated.MimeType, cancellationToken);

        return await _createPlantPhotoHandler.HandleAsync(
            new CreatePlantPhotoCommand(
                clientId,
                plantId,
                photoTypeId,
                string.IsNullOrWhiteSpace(fileName) ? $"{safePart}-{validated.FileName}" : fileName.Trim(),
                fileUrl,
                isPrimary,
                isActive),
            cancellationToken);
    }
}

public class CreatePlantRequest
{
    public Guid? InstallationId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? PlantTypeId { get; set; }
    public Guid? PlantStatusId { get; set; }
    public string? LightExposureCode { get; set; }
    public string? LightExposureLabel { get; set; }
    public string? SoilType { get; set; }
    public string? Fertilizer { get; set; }
    public int[]? FloweringMonths { get; set; }
    public string[]? FertilizationSeasons { get; set; }
    public bool? IsActive { get; set; }

    public CreatePlantCommand ToCommand(Guid clientId)
        => new(clientId, InstallationId, Code, Name, Description, PlantTypeId, PlantStatusId, LightExposureCode, LightExposureLabel, SoilType, Fertilizer, FloweringMonths, FertilizationSeasons, IsActive);
}

public sealed class CreatePlantWithPhotosRequest : CreatePlantRequest
{
    public Guid? LeafPhotoTypeId { get; set; }
    public Guid? TrunkPhotoTypeId { get; set; }
    public Guid? StemPhotoTypeId { get; set; }
    public Guid? GeneralPhotoTypeId { get; set; }
    public string? LeafFileName { get; set; }
    public string? TrunkFileName { get; set; }
    public string? StemFileName { get; set; }
    public string? GeneralFileName { get; set; }
    public IFormFile? LeafImage { get; set; }
    public IFormFile? TrunkImage { get; set; }
    public IFormFile? StemImage { get; set; }
    public IFormFile? GeneralImage { get; set; }

    public async Task<IReadOnlyList<CreatePlantPhotoUpload>> ToPhotoUploadsAsync(CancellationToken cancellationToken)
    {
        var uploads = new List<CreatePlantPhotoUpload>();

        if (LeafImage is { Length: > 0 })
        {
            uploads.Add(new CreatePlantPhotoUpload(
                "leaf",
                await ToPayloadAsync(LeafImage, "leaf", cancellationToken),
                LeafFileName,
                false,
                LeafPhotoTypeId,
                true));
        }

        var trunkImage = TrunkImage ?? StemImage;
        if (trunkImage is { Length: > 0 })
        {
            var photoPart = TrunkImage is not null ? "trunk" : "stem";
            uploads.Add(new CreatePlantPhotoUpload(
                photoPart,
                await ToPayloadAsync(trunkImage, photoPart, cancellationToken),
                TrunkImage is not null ? TrunkFileName : StemFileName,
                false,
                TrunkImage is not null ? TrunkPhotoTypeId : StemPhotoTypeId,
                true));
        }

        if (GeneralImage is { Length: > 0 })
        {
            uploads.Add(new CreatePlantPhotoUpload(
                "general",
                await ToPayloadAsync(GeneralImage, "general", cancellationToken),
                GeneralFileName,
                true,
                GeneralPhotoTypeId,
                true));
        }

        return uploads;
    }

    private static async Task<PlantPhotoPayload> ToPayloadAsync(IFormFile formFile, string part, CancellationToken cancellationToken)
    {
        await using var stream = formFile.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        return new PlantPhotoPayload(
            formFile.FileName,
            string.IsNullOrWhiteSpace(formFile.ContentType) ? "application/octet-stream" : formFile.ContentType,
            memoryStream.ToArray(),
            part);
    }
}

public sealed record CreatePlantPhotoUpload(
    string PhotoPart,
    PlantPhotoPayload Payload,
    string? FileName,
    bool IsPrimary,
    Guid? PhotoTypeId,
    bool? IsActive);

public sealed class UpdatePlantRequest
{
    public Guid? InstallationId { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? PlantTypeId { get; set; }
    public Guid? PlantStatusId { get; set; }
    public string? LightExposureCode { get; set; }
    public string? LightExposureLabel { get; set; }
    public string? SoilType { get; set; }
    public string? Fertilizer { get; set; }
    public int[]? FloweringMonths { get; set; }
    public string[]? FertilizationSeasons { get; set; }
    public bool? IsActive { get; set; }

    public UpdatePlantCommand ToCommand(Guid clientId, Guid plantId)
        => new(clientId, plantId, InstallationId, Code, Name, Description, PlantTypeId, PlantStatusId, LightExposureCode, LightExposureLabel, SoilType, Fertilizer, FloweringMonths, FertilizationSeasons, IsActive);
}

public sealed class AnalyzePlantPhotosRequest
{
    public string? Language { get; set; }
    public IFormFile? LeafImage { get; set; }
    public IFormFile? TrunkImage { get; set; }
    public IFormFile? GeneralImage { get; set; }

    public async Task<AnalyzePlantPhotosCommand> ToCommandAsync(Guid clientId, CancellationToken cancellationToken)
        => new(
            clientId,
            Language,
            await ToPayloadAsync(LeafImage, "leaf", cancellationToken),
            await ToPayloadAsync(TrunkImage, "trunk", cancellationToken),
            await ToPayloadAsync(GeneralImage, "general", cancellationToken));

    private static async Task<PlantPhotoPayload> ToPayloadAsync(IFormFile? formFile, string part, CancellationToken cancellationToken)
    {
        if (formFile is null || formFile.Length == 0)
        {
            return PlantPhotoPayload.Empty() with { PhotoPart = part };
        }

        await using var stream = formFile.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        return new PlantPhotoPayload(
            formFile.FileName,
            string.IsNullOrWhiteSpace(formFile.ContentType) ? "application/octet-stream" : formFile.ContentType,
            memoryStream.ToArray(),
            part);
    }
}

public sealed class CreatePlantPhotoRequest
{
    public Guid? PhotoTypeId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public bool? IsActive { get; set; }

    public CreatePlantPhotoCommand ToCommand(Guid clientId, Guid plantId)
        => new(clientId, plantId, PhotoTypeId, FileName, FileUrl, IsPrimary, IsActive);
}

public sealed class UploadPlantPhotoRequest
{
    public Guid? PhotoTypeId { get; set; }
    public string? PhotoPart { get; set; }
    public string? FileName { get; set; }
    public bool IsPrimary { get; set; }
    public bool? IsActive { get; set; }
    public IFormFile? Image { get; set; }

    public async Task<PlantPhotoPayload> ToPayloadAsync(CancellationToken cancellationToken)
    {
        if (Image is null || Image.Length == 0)
        {
            return PlantPhotoPayload.Empty() with { PhotoPart = PhotoPart };
        }

        await using var stream = Image.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        return new PlantPhotoPayload(
            Image.FileName,
            string.IsNullOrWhiteSpace(Image.ContentType) ? "application/octet-stream" : Image.ContentType,
            memoryStream.ToArray(),
            PhotoPart);
    }
}

public sealed class CreatePlantThresholdRequest
{
    public Guid ReadingTypeId { get; set; }
    public Guid? UnitTypeId { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? OptimalValue { get; set; }
    public bool? IsActive { get; set; }

    public CreatePlantThresholdCommand ToCommand(Guid clientId, Guid plantId)
        => new(clientId, plantId, ReadingTypeId, UnitTypeId, MinValue, MaxValue, OptimalValue, IsActive);
}

public sealed class UpdatePlantThresholdRequest
{
    public Guid? ReadingTypeId { get; set; }
    public Guid? UnitTypeId { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? OptimalValue { get; set; }
    public bool? IsActive { get; set; }

    public UpdatePlantThresholdCommand ToCommand(Guid clientId, Guid plantId, Guid thresholdId)
        => new(clientId, plantId, thresholdId, ReadingTypeId, UnitTypeId, MinValue, MaxValue, OptimalValue, IsActive);
}

public sealed class CreatePlantEventRequest
{
    public Guid EventTypeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime EventDate { get; set; }
    public bool? IsActive { get; set; }

    public CreatePlantEventCommand ToCommand(Guid clientId, Guid plantId)
        => new(clientId, plantId, EventTypeId, Title, Description, Notes, EventDate, IsActive);
}

public sealed class UpdatePlantEventRequest
{
    public Guid? EventTypeId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime? EventDate { get; set; }
    public bool? IsActive { get; set; }

    public UpdatePlantEventCommand ToCommand(Guid clientId, Guid plantId, Guid eventId)
        => new(clientId, plantId, eventId, EventTypeId, Title, Description, Notes, EventDate, IsActive);
}
