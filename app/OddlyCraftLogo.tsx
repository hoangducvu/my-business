interface OddlyCraftLogoProps {
  /** text + stroke colour, defaults to brand maroon */
  color?: string
  /** flower petal colour, defaults to pink */
  flowerColor?: string
  className?: string
}

export default function OddlyCraftLogo({
  color = '#881338',
  flowerColor = '#FF87B0',
  className = '',
}: OddlyCraftLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 760 175"
      aria-label="OddlyCraft"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Main logo text — uses Baloo 2 already loaded by layout */}
      <text
        fontFamily="var(--font-baloo), 'Baloo 2', cursive"
        fontWeight="800"
        fontSize="132"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        x="10"
        y="150"
        letterSpacing="1"
      >
        Oddly Craft
      </text>

      {/* Flower on the O — rotated 25° */}
      <g transform="translate(53, 51) rotate(25)">
        {/* 5 round petals */}
        <circle cx="0"      cy="-13"   r="8.5" fill={flowerColor} />
        <circle cx="12.36"  cy="-4.05" r="8.5" fill={flowerColor} />
        <circle cx="7.64"   cy="10.56" r="8.5" fill={flowerColor} />
        <circle cx="-7.64"  cy="10.56" r="8.5" fill={flowerColor} />
        <circle cx="-12.36" cy="-4.05" r="8.5" fill={flowerColor} />
        {/* Centre */}
        <circle cx="0" cy="0" r="8"   fill={flowerColor} />
        <circle cx="0" cy="0" r="4.5" fill="white" />
      </g>
    </svg>
  )
}
