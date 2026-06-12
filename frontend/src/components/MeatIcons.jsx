// Iconografía del sector cárnico usada como decoración en toda la app.

export function SteakIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 26c0-9 10-16 24-16s22 8 22 16c0 7-5 9-9 12s-3 10-13 12S10 44 10 26z"
        fill="#C0152A"
        stroke="#7d0f1d"
        strokeWidth="2.5"
      />
      <path
        d="M18 26c0-6 7-10 16-10s14 5 14 10c0 5-4 6-7 8s-2 7-9 8-14-7-14-16z"
        fill="#E8607A"
        opacity="0.85"
      />
      <path d="M24 24c4-3 12-3 16 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M26 31c3-2 9-2 12 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function BoneIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 14a7 7 0 0 1 8 6l10 10a7 7 0 1 1 6 12 7 7 0 1 1-12 6L22 38a7 7 0 1 1-6-12 7 7 0 0 1 4-12z"
        fill="#FBE9DD"
        stroke="#C0152A"
        strokeWidth="3"
      />
    </svg>
  )
}

export function CleaverIcon({ size = 26 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14h34l6 22H16z" fill="#d9dde2" stroke="#5a6470" strokeWidth="2.5" />
      <circle cx="16" cy="20" r="2.6" fill="#5a6470" />
      <rect x="44" y="30" width="14" height="7" rx="3.5" transform="rotate(40 44 30)" fill="#7d4a1e" stroke="#4f2e11" strokeWidth="2" />
    </svg>
  )
}

export function SausageIcon({ size = 26 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 44C10 28 24 12 44 12c5 0 8 3 6 7-8 14-12 22-26 30-4 2-9-1-10-5z"
        fill="#C0152A"
        stroke="#7d0f1d"
        strokeWidth="2.5"
      />
      <path d="M22 36c4-8 10-14 18-18" stroke="#E8607A" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// Patrón de fondo con siluetas cárnicas (se usa como marca de agua animada).
export function MeatPattern() {
  const items = [
    { Icon: SteakIcon, top: '8%', left: '4%', size: 64, delay: '0s' },
    { Icon: BoneIcon, top: '22%', left: '88%', size: 52, delay: '1.2s' },
    { Icon: SausageIcon, top: '58%', left: '6%', size: 56, delay: '0.6s' },
    { Icon: CleaverIcon, top: '74%', left: '90%', size: 60, delay: '1.8s' },
    { Icon: SteakIcon, top: '85%', left: '46%', size: 48, delay: '0.3s' },
    { Icon: BoneIcon, top: '40%', left: '50%', size: 44, delay: '2.2s' },
  ]
  return (
    <div className="meat-pattern" aria-hidden="true">
      {items.map(({ Icon, top, left, size, delay }, i) => (
        <span key={i} className="meat-float" style={{ top, left, animationDelay: delay }}>
          <Icon size={size} />
        </span>
      ))}
    </div>
  )
}
