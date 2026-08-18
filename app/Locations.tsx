/**
 * "Plaza Sliema / Mercury St Julians" — the two shops, side by side, each under
 * a typewriter heading with a live map beneath it.
 *
 * Sits directly under Build Your Bracelet and shares its yellow, so the two
 * read as one band of colour with a change of subject rather than as two
 * sections that happen to be the same shade.
 *
 * ── The maps are queries, not coordinates ────────────────────────────────
 * Each iframe asks Google for a PLACE BY NAME and lets Google drop the pin.
 * That is deliberate: a hand-typed lat/long is a silent way to send a customer
 * to the wrong end of Sliema, and nothing on the page would ever look wrong.
 * A name that resolves to the wrong place at least resolves to somewhere
 * recognisable, and it keeps working if a unit number changes.
 *
 * The trade is that Google chooses the framing, so the pin is the shopping
 * centre rather than the unit inside it. TO PIN THE EXACT SHOPFRONT: open the
 * shop's own listing on Google Maps → Share → Embed a map, and drop the `src`
 * it gives you in as `map` below. It is the same kind of URL and needs no key.
 */

type Shop = {
  /** Heading, as it should read on the page. */
  name: string
  /** What the map is asked to find. See the note above before changing it. */
  query: string
  /** Spoken description of the map, for anyone who cannot see it. */
  alt: string
}

const SHOPS: Shop[] = [
  {
    name: 'Plaza Sliema',
    query: 'The Plaza Shopping Centre, Bisazza Street, Sliema, Malta',
    alt: 'Map showing the OddlyCraft shop at The Plaza Shopping Centre, Bisazza Street, Sliema',
  },
  {
    name: 'Mercury St Julians',
    query: 'Mercury Towers, St Julian’s, Malta',
    alt: 'Map showing the OddlyCraft shop at Mercury, St Julian’s',
  },
]

/**
 * The keyless Google Maps embed. `output=embed` is the form that works without
 * an API key; the official Embed API (`/maps/embed/v1/place`) needs one, and
 * the shop does not have one set up.
 */
function mapSrc(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`
}

/**
 * Map pin, sitting before a shop name — the map-marker shape: a round head
 * that narrows to a point at the bottom.
 *
 * ── The shape ────────────────────────────────────────────────────────────
 * The head is a TRUE CIRCLE, closed with a single arc, and the point is two
 * curves hung off its lower quarters. An earlier version drew the whole thing
 * as one rounded teardrop, which is a subtly different object: without a
 * circular head there is no waist where the head meets the stem, and the
 * result reads as a balloon or a raindrop rather than as a marker dropped on
 * a map. The waist is the whole silhouette — protect it if this is retuned.
 *
 * Solid rather than outlined, because at heading size an outlined marker is
 * two thin concentric curves and a dot. The hole is punched THROUGH the fill
 * with `fillRule="evenodd"` rather than painted over in the background colour:
 * it sits on yellow here and would sit on something else the moment it moves.
 */
function Pin() {
  return (
    <svg className="venues__pin" viewBox="0 0 24 32" aria-hidden focusable="false">
      <path
        fillRule="evenodd"
        d="M12 1.4 A9.6 9.6 0 1 0 12 20.6 A9.6 9.6 0 1 0 12 1.4 Z
           M4.4 16.6 C6.6 21.6 12 30.6 12 30.6 C12 30.6 17.4 21.6 19.6 16.6
           C17.9 19.1 15.2 20.6 12 20.6 C8.8 20.6 6.1 19.1 4.4 16.6 Z
           M12 15.6 A4.6 4.6 0 1 1 12 6.4 A4.6 4.6 0 1 1 12 15.6 Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Locations() {
  return (
    <section id="locations" className="venues" aria-labelledby="venues-heading">
      {/* Named for screen readers only. On the page the two shop names do the
          work of a heading, exactly as on the reference — a third heading over
          the top of them would just be a label for two labels. */}
      <h2 id="venues-heading" className="sr-only">Our shops</h2>

      <div className="venues__grid">
        {SHOPS.map((shop) => (
          <div key={shop.name} className="venues__col">
            <h3 className="venues__title">
              <Pin />
              {shop.name}
            </h3>
            <div className="venues__card">
              <iframe
                className="venues__map"
                src={mapSrc(shop.query)}
                title={shop.alt}
                loading="lazy"
                // Google needs to see where the embed is hosted to serve the
                // map; the default policy drops the referrer on the https→https
                // hop for some browsers and the frame comes back empty.
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
