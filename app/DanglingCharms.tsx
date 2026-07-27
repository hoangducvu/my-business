type Charm = {
  src: string
  left: number | null
  right: number | null
  top: number
  size: number
  rotate: number
  dur: number
  delay: number
}

const CHARMS: Charm[] = [
  { src: '/charms/rainbow-heart.png', left: -8,   right: null, top: -8, size: 44, rotate: -10, dur: 4.1, delay: 0 },
  { src: '/charms/pink-star.png',     left: 22,   right: null, top: 2,  size: 38, rotate: 8,   dur: 3.4, delay: 0.7 },
  { src: '/charms/good-luck.png',     left: null, right: -8,   top: -6, size: 42, rotate: 9,   dur: 3.8, delay: 0.4 },
  { src: '/charms/sparkle-heart.png', left: null, right: 24,   top: 4,  size: 38, rotate: -7,  dur: 3.1, delay: 1.1 },
]

export default function DanglingCharms() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[65] hidden md:block"
      style={{ height: 0 }}
    >
      {CHARMS.map((c) => (
        <div
          key={c.src}
          className="absolute"
          style={{ left: c.left ?? undefined, right: c.right ?? undefined, top: c.top }}
        >
          {/* static base tilt — kept separate from the swing so the animation doesn't override it */}
          <div style={{ transform: `rotate(${c.rotate}deg)`, transformOrigin: 'top center' }}>
            <div
              className="animate-swing"
              style={{
                transformOrigin: 'top center',
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            >
              {/* jump ring connecting to an implied thread above */}
              <div
                style={{
                  width: 11,
                  height: 7,
                  margin: '0 auto',
                  border: '2px solid #d4af62',
                  borderRadius: '50%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
                }}
              />
              <img
                src={c.src}
                alt=""
                width={c.size}
                height={c.size}
                style={{
                  display: 'block',
                  marginTop: -2,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.3))',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
