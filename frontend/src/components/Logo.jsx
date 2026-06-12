// Logo FRIGOR recreado en SVG: cápsula roja con borde negro/blanco,
// texto blanco en cursiva pesada y el hashtag corporativo debajo.
export default function Logo({ width = 220, tagline = true }) {
  return (
    <div className="frigor-logo" style={{ width }}>
      <svg viewBox="0 0 440 170" width="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="capRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8344B" />
            <stop offset="45%" stopColor="#C0152A" />
            <stop offset="100%" stopColor="#8E0E1F" />
          </linearGradient>
          <linearGradient id="capShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <rect x="6" y="8" rx="60" ry="60" width="428" height="120" fill="#16110f" />
        <rect x="16" y="17" rx="52" ry="52" width="408" height="102" fill="#ffffff" />
        <rect x="24" y="24" rx="46" ry="46" width="392" height="88" fill="url(#capRed)" />
        <rect x="44" y="30" rx="32" ry="32" width="352" height="38" fill="url(#capShine)" />
        <text
          x="220"
          y="92"
          textAnchor="middle"
          fontFamily="'Archivo', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="58"
          fill="#ffffff"
          letterSpacing="2"
        >
          FRIGOR
        </text>
        {tagline && (
          <text
            x="220"
            y="160"
            textAnchor="middle"
            fontFamily="'Archivo', sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="34"
            fill="currentColor"
            className="logo-tagline"
          >
            #CarneEs<tspan fill="#C0152A">FRIGOR</tspan>
          </text>
        )}
      </svg>
    </div>
  )
}
