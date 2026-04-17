import { useState } from 'react';

import { ImageCarouselModal } from '@/shared/ui/ImageCarouselModal';
import { ThumbnailGallery } from '@/shared/ui/ThumbnailGallery';
import { TimelineItem } from '@/shared/ui/TimelineItem';
import { TimelineList } from '@/shared/ui/TimelineList';

export interface PlantPhotoTimelineEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  confidence?: string;
  images: string[];
  highlight?: boolean;
}

interface PlantPhotoTimelineProps {
  entries: PlantPhotoTimelineEntry[];
}

export function PlantPhotoTimeline({ entries }: PlantPhotoTimelineProps) {
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const activeEntry = entries.find((entry) => entry.id === openEntryId) ?? null;

  return (
    <>
      <section className="panel-card">
        <div className="section-heading">
          <div>
            <strong>Photo history</strong>
            <p>Chronology sorted by date with thumbnails and expandable carousel view.</p>
          </div>
        </div>
        <TimelineList>
          {entries.map((entry) => (
            <TimelineItem
              key={entry.id}
              date={entry.date}
              highlight={entry.highlight}
              meta={entry.confidence ? <span className="badge">Confidence {entry.confidence}</span> : null}
              summary={entry.summary}
              title={entry.title}
            >
              <ThumbnailGallery
                images={entry.images}
                onSelect={(index) => {
                  setImageIndex(index);
                  setOpenEntryId(entry.id);
                }}
              />
            </TimelineItem>
          ))}
        </TimelineList>
      </section>

      <ImageCarouselModal
        images={activeEntry?.images ?? []}
        index={imageIndex}
        open={Boolean(activeEntry)}
        onClose={() => setOpenEntryId(null)}
        onNext={() => {
          if (!activeEntry) return;
          setImageIndex((current) => (current + 1) % activeEntry.images.length);
        }}
        onPrev={() => {
          if (!activeEntry) return;
          setImageIndex((current) => (current - 1 + activeEntry.images.length) % activeEntry.images.length);
        }}
      />
    </>
  );
}
