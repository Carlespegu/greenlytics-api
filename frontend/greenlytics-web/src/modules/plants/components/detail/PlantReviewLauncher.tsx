import { LoaderCircle } from 'lucide-react';

interface PlantReviewLauncherProps {
  photoCount: number;
  reviewRunning: boolean;
  onUpload: (key: 'leaf' | 'stem' | 'general') => void;
  onLaunch: () => void;
  values: Record<'leaf' | 'stem' | 'general', string | null>;
}

export function PlantReviewLauncher({ photoCount, reviewRunning, onUpload, onLaunch, values }: PlantReviewLauncherProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <strong>New review</strong>
          <p>Add three new photos to launch a new plant state review.</p>
        </div>
        <div className="badge">{photoCount}/3 photos</div>
      </div>

      <div className="detail-grid detail-grid--three">
        {(['leaf', 'stem', 'general'] as const).map((key) => (
          <article className="detail-item" key={key}>
            <span>{key === 'leaf' ? 'Leaves and flowers' : key === 'stem' ? 'Stem' : 'General view'}</span>
            <strong>{values[key] ?? 'Pending upload'}</strong>
            <button className="secondary-button" type="button" onClick={() => onUpload(key)}>Simulate upload</button>
          </article>
        ))}
      </div>

      <button className="primary-button" disabled={photoCount !== 3 || reviewRunning} type="button" onClick={onLaunch}>
        {reviewRunning ? <LoaderCircle className="spin" size={16} /> : null}
        <span>{reviewRunning ? 'Analyzing review...' : 'Launch review'}</span>
      </button>
    </section>
  );
}
