import { useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantHistoryEntry } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { TimelineItem } from '@/shared/ui/TimelineItem';
import { TimelineList } from '@/shared/ui/TimelineList';

interface PlantHistoryTabProps {
  entries: PlantHistoryEntry[];
}

export function PlantHistoryTab({ entries }: PlantHistoryTabProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'event' | 'photo'>('all');

  const visibleEntries = useMemo(
    () => entries.filter((entry) => filter === 'all' || entry.source === filter),
    [entries, filter],
  );

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.historyTitle')}
          subtitle={t('plantDetail.historySubtitle')}
          action={(
            <div className="plant-detail-v3__history-toolbar">
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                <option value="all">{t('plantDetail.allActivity')}</option>
                <option value="event">{t('plantDetail.plantEvents')}</option>
                <option value="photo">{t('plantDetail.photoUploads')}</option>
              </select>
              <button className="secondary-button" disabled title="Event form hook pending." type="button">
                <CalendarPlus size={16} />
                <span>{t('plantDetail.addEvent')}</span>
              </button>
            </div>
          )}
        />

        {visibleEntries.length === 0 ? (
          <EmptyState title={t('plantDetail.noHistory')} description={t('plantDetail.noHistoryDescription')} />
        ) : (
          <TimelineList>
            {visibleEntries.map((entry) => (
              <TimelineItem
                key={entry.id}
                date={entry.dateLabel}
                meta={<span className="badge">{entry.type}</span>}
                summary={entry.summary}
                title={entry.title}
              />
            ))}
          </TimelineList>
        )}
      </section>
    </div>
  );
}
