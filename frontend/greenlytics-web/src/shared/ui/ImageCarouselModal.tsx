import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselModalProps {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ImageCarouselModal({ images, index, open, onClose, onPrev, onNext }: ImageCarouselModalProps) {
  if (!open || images.length === 0) {
    return null;
  }

  return (
    <div className="image-carousel-modal" role="presentation">
      <button aria-label="Close carousel" className="image-carousel-modal__backdrop" type="button" onClick={onClose} />
      <div aria-modal="true" className="image-carousel-modal__card" role="dialog">
        <button aria-label="Close" className="image-carousel-modal__close" type="button" onClick={onClose}><X size={18} /></button>
        <button aria-label="Previous image" className="image-carousel-modal__nav image-carousel-modal__nav--prev" type="button" onClick={onPrev}><ChevronLeft size={22} /></button>
        <img alt={`Image ${index + 1}`} className="image-carousel-modal__image" src={images[index]} />
        <button aria-label="Next image" className="image-carousel-modal__nav image-carousel-modal__nav--next" type="button" onClick={onNext}><ChevronRight size={22} /></button>
        <div className="image-carousel-modal__caption">Image {index + 1} of {images.length}</div>
      </div>
    </div>
  );
}
