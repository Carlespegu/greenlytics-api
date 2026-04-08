export default function PlantLoader({
  size = 64,
  label = 'Carregant...',
  centered = false,
  className = '',
}) {
  const wrapperClassName = centered
    ? `flex min-h-[180px] flex-col items-center justify-center gap-4 ${className}`
    : `inline-flex items-center gap-3 ${className}`

  return (
    <div className={wrapperClassName} role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <rect x="6" y="52" width="52" height="6" rx="3" fill="var(--brand-primary-soft-strong)" />

        <path
          d="M32 50V23"
          stroke="var(--brand-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          className="origin-bottom animate-[plant-grow_1.6s_ease-in-out_infinite]"
        />

        <path
          d="M31 34C22 34 16 28 16 20C25 20 31 25 31 34Z"
          fill="var(--brand-primary)"
          className="origin-bottom animate-[leaf-left_1.6s_ease-in-out_infinite]"
        />
        <path
          d="M33 30C42 30 48 24 48 16C39 16 33 21 33 30Z"
          fill="var(--brand-primary)"
          opacity="0.9"
          className="origin-bottom animate-[leaf-right_1.6s_ease-in-out_infinite]"
        />
        <path
          d="M32 22C27 22 24 18 24 13C29 13 32 16 32 22Z"
          fill="var(--brand-primary)"
          opacity="0.75"
          className="origin-bottom animate-[leaf-top_1.6s_ease-in-out_infinite]"
        />
      </svg>

      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  )
}
