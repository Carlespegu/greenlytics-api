export default function SunLoader({ size = 18, className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1.5V4" />
          <path d="M12 20v2.5" />
          <path d="M1.5 12H4" />
          <path d="M20 12h2.5" />
          <path d="M4.22 4.22l1.77 1.77" />
          <path d="M18.01 18.01l1.77 1.77" />
          <path d="M18.01 5.99l1.77-1.77" />
          <path d="M4.22 19.78l1.77-1.77" />
        </g>
      </svg>
    </span>
  )
}