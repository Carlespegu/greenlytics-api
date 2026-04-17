export function LoadingScreen({ label = 'Loading GreenLytics V3...' }: { label?: string }) {
  return <div className="loading-screen">{label}</div>;
}
