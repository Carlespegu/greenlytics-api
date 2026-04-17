using GreenLytics.V3.Domain.Entities;

namespace GreenLytics.V3.Application.Plants;

public static class PlantMapper
{
    public static PlantPhotoDto ToPhotoDto(
        this Photo entity,
        string? photoTypeCode = null,
        string? photoTypeName = null)
        => new(
            entity.Id,
            entity.PlantId,
            entity.PhotoTypeId,
            photoTypeCode,
            photoTypeName,
            entity.FileName,
            entity.FileUrl,
            entity.IsPrimary,
            entity.IsActive,
            entity.CreatedAt,
            entity.CreatedByUserId);

    public static PlantThresholdDto ToThresholdDto(
        this PlantThreshold entity,
        string? readingTypeCode = null,
        string? readingTypeName = null,
        string? unitTypeCode = null,
        string? unitTypeName = null)
        => new(
            entity.Id,
            entity.PlantId,
            entity.ReadingTypeId,
            readingTypeCode,
            readingTypeName,
            entity.UnitTypeId,
            unitTypeCode,
            unitTypeName,
            entity.MinValue,
            entity.MaxValue,
            entity.OptimalValue,
            entity.IsActive,
            entity.CreatedAt,
            entity.CreatedByUserId,
            entity.UpdatedAt,
            entity.UpdatedByUserId);

    public static PlantEventDto ToEventDto(
        this PlantEvent entity,
        string? eventTypeCode = null,
        string? eventTypeName = null)
        => new(
            entity.Id,
            entity.ClientId,
            entity.PlantId,
            entity.EventTypeId,
            eventTypeCode,
            eventTypeName,
            entity.Title,
            entity.Description,
            entity.Notes,
            entity.EventDate,
            entity.IsActive,
            entity.CreatedAt,
            entity.CreatedByUserId,
            entity.UpdatedAt,
            entity.UpdatedByUserId);
}
