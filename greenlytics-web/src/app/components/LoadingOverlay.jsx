import PlantLoader from './PlantLoader'

export default function LoadingOverlay({
  visible = false,
  label = 'Carregant...',
  transparent = false,
}) {
  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center ${
        transparent ? 'bg-slate-950/20' : 'bg-slate-950/32'
      } backdrop-blur-[2px]`}
    >
      <div className="rounded-3xl border border-slate-200 bg-white/96 px-8 py-7 shadow-2xl">
        <PlantLoader centered label={label} className="min-h-0" />
      </div>
    </div>
  )
}
