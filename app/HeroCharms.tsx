export default function HeroCharms() {
  return (
    <section
      className="relative w-full overflow-hidden py-10 sm:py-16"
      style={{ background: 'var(--background)' }}
    >
      <div className="relative mx-auto max-w-3xl px-6 flex flex-col items-center justify-center gap-3 sm:gap-4">
        <div className="animate-text-bob" style={{ animationDelay: '0s' }}>
          <img src="/hero-text/welcome.png" alt="Welcome" style={{ width: 'min(369px, 60vw)', height: 'auto' }} />
        </div>
        <div className="animate-text-bob" style={{ animationDelay: '0.35s' }}>
          <img src="/hero-text/to.png" alt="to" style={{ width: 'min(96px, 15.6vw)', height: 'auto' }} />
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <div className="animate-text-bob" style={{ animationDelay: '0.7s' }}>
            <img src="/hero-text/custom.png" alt="Custom" style={{ width: 'min(274px, 44.5vw)', height: 'auto' }} />
          </div>
          <div className="animate-text-bob" style={{ animationDelay: '1.05s' }}>
            <img src="/hero-text/club.png" alt="Club" style={{ width: 'min(193px, 31.3vw)', height: 'auto' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
