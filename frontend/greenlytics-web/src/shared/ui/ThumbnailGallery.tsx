interface ThumbnailGalleryProps {
  images: string[];
  onSelect: (index: number) => void;
}

export function ThumbnailGallery({ images, onSelect }: ThumbnailGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="thumbnail-gallery">
      {images.map((image, index) => (
        <button key={`${image}-${index}`} className="thumbnail-gallery__item" type="button" onClick={() => onSelect(index)}>
          <img alt={`Thumbnail ${index + 1}`} src={image} />
        </button>
      ))}
    </div>
  );
}
