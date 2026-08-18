// Asset pipeline for the hero charm shower.
//
//   node build-charms.mjs
//
// Takes the product shots in ../Gold Charm and ../Dangles, knocks out the white
// studio background, trims to the charm, and writes web-sized WebP cut-outs to
// public/charms/pour. Re-run it after adding names to PICKS.

import sharp from 'sharp'
import { mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'C:/Users/vubao/OneDrive/Documents/Oddly Craft'
const OUT = path.join(ROOT, 'my-business/public/charms/pour')

const MAX = 200
const QUALITY = 82

// Background knock-out thresholds. A pixel counts as studio backdrop only if it
// is bright, near-neutral, AND reachable from the border — so a white pearl or
// a daisy in the middle of a charm is never eaten.
const BG_MIN_BRIGHT = 222
const BG_MAX_CHROMA = 26
const FEATHER_MIN = 198

// Deliberately no licensed characters or car marques from Gold Charm — those
// are fine on a product page but not as decorative confetti on the homepage.
const PICKS = [
  // ── Gold Charm: flat rectangular Italian links ──
  ['Gold Charm', 'Rainbow Heart'], ['Gold Charm', 'Sparkle Heart'],
  ['Gold Charm', 'Good Luck'], ['Gold Charm', 'Smiley Face'],
  ['Gold Charm', 'Lucky 3 Leaf Clover'], ['Gold Charm', 'Girl Power Heart'],
  ['Gold Charm', 'Cotton Candy'], ['Gold Charm', 'Pink Star Bubble'],
  ['Gold Charm', 'Red Star'], ['Gold Charm', 'Black Star'],
  ['Gold Charm', 'Earth Heart'], ['Gold Charm', 'Paper Crane'],
  ['Gold Charm', 'Pink Ribbon'], ['Gold Charm', 'Sunset'],
  ['Gold Charm', 'Unicorn Whale'], ['Gold Charm', 'Fries'],
  ['Gold Charm', 'Beach Island'], ['Gold Charm', 'Cappucino'],
  ['Gold Charm', 'Elephant'], ['Gold Charm', 'Game Controller'],
  ['Gold Charm', 'Lipstick'], ['Gold Charm', 'Telephone'],
  ['Gold Charm', 'Vinyl Record Player'], ['Gold Charm', 'Football'],

  // ── Dangles: three-dimensional dangling charms ──
  ['Dangles', 'Ruby Heart'], ['Dangles', 'Lucky Star'],
  ['Dangles', 'Crystal Butterfly'], ['Dangles', 'Cherry Bow'],
  ['Dangles', 'Clover'], ['Dangles', 'Evil Eye Medallion'],
  ['Dangles', 'Rainbow'], ['Dangles', 'Pearl Bow'],
  ['Dangles', 'Heart Lock'], ['Dangles', 'Key'],
  ['Dangles', 'Crescent Moon and Sun'], ['Dangles', 'Strawberry Cake'],
  ['Dangles', 'Angel Wing'], ['Dangles', 'Anchor'],
  ['Dangles', 'Apple'], ['Dangles', 'Avocado'],
  ['Dangles', 'Ballerina Shoes'], ['Dangles', 'Banana'],
  ['Dangles', 'Bumblebee'], ['Dangles', 'Black Cat'],
  ['Dangles', 'Cactus'], ['Dangles', 'Champagne Glass'],
  ['Dangles', 'Cloud'], ['Dangles', 'Cocktail Glass'],
  ['Dangles', 'Compass'], ['Dangles', 'Cowboy Boot'],
  ['Dangles', 'Cross'], ['Dangles', 'Crystal Flower'],
  ['Dangles', 'Dice'], ['Dangles', 'Dinosaur'],
  ['Dangles', 'Dolphin'], ['Dangles', 'Dumpling'],
  ['Dangles', 'Eighth Note'], ['Dangles', 'Hamsa'],
  ['Dangles', 'Headphone'], ['Dangles', 'Hibiscus Flower'],
  ['Dangles', 'Hotdog'], ['Dangles', 'Infinity'],
  ['Dangles', 'Lifesaver'], ['Dangles', 'Lobster'],
  ['Dangles', 'Martini Glass'], ['Dangles', 'Mermaid'],
  ['Dangles', 'Money Bag'], ['Dangles', 'Mushroom Pizza'],
  ['Dangles', 'Padlock'], ['Dangles', 'Passport'],
  ['Dangles', 'Peach'], ['Dangles', 'Pretzel'],
  ['Dangles', 'Saturn'], ['Dangles', 'Sailboat'],
  ['Dangles', 'Scallop Shell'], ['Dangles', 'Smiling Snail'],
  ['Dangles', 'Spade'], ['Dangles', 'Sushi Set'],
  ['Dangles', 'Ticket'], ['Dangles', 'Tennis Racket'],
  ['Dangles', 'White Daisy'], ['Dangles', 'White Dove'],
  ['Dangles', 'White Ladybug'], ['Dangles', 'Winged Heart'],
  ['Dangles', 'Yin and Yang'], ['Dangles', 'Rose Bouquet'],
  ['Dangles', 'Sun Rise'], ['Dangles', 'Polaris Star'],
  ['Dangles', 'Red Boxing Glove'], ['Dangles', 'Pink Luggage'],
  ['Dangles', 'Pink Skateboard'], ['Dangles', 'Movie Clapperboard'],
  ['Dangles', 'Matcha Cup'], ['Dangles', 'Grape'],
  ['Dangles', 'Christmas Tree'], ['Dangles', 'Crowned Heart'],
]

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Knock out the studio backdrop.
 *
 * Flood-fills inward from the image border and clears only pixels that are both
 * background-coloured and connected to the edge. Anything enclosed by the charm
 * survives, which is what keeps pearls, white enamel and pale gemstones intact.
 * Edge pixels get a partial alpha so the cut-out doesn't come out with a hard
 * white fringe.
 */
function knockOutBackground(data, w, h) {
  const isBg = (o) => {
    if (data[o + 3] < 16) return true
    const r = data[o], g = data[o + 1], b = data[o + 2]
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    return min >= BG_MIN_BRIGHT && max - min <= BG_MAX_CHROMA
  }

  const bg = new Uint8Array(w * h)
  const stack = []

  for (let x = 0; x < w; x++) {
    stack.push(x, (h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1)
  }

  while (stack.length) {
    const i = stack.pop()
    if (bg[i]) continue
    if (!isBg(i * 4)) continue
    bg[i] = 1
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }

  let cleared = 0
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) {
      if (data[i * 4 + 3] > 15) cleared++
      data[i * 4 + 3] = 0
    }
  }

  // Feather: soften surviving pale pixels that touch the knocked-out region,
  // scaling alpha by how far they are from pure backdrop.
  let feathered = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (bg[i]) continue
      const o = i * 4
      if (data[o + 3] === 0) continue
      const touches =
        (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) ||
        (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w])
      if (!touches) continue
      const min = Math.min(data[o], data[o + 1], data[o + 2])
      if (min < FEATHER_MIN) continue
      const t = (min - FEATHER_MIN) / (BG_MIN_BRIGHT - FEATHER_MIN)
      data[o + 3] = Math.round(data[o + 3] * (1 - Math.min(1, t)))
      feathered++
    }
  }

  return { cleared, feathered }
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const dirCache = new Map()
async function listDir(dir) {
  if (!dirCache.has(dir)) dirCache.set(dir, await readdir(dir))
  return dirCache.get(dir)
}

const slugs = []
const missing = []
const report = []

for (const [folder, base] of PICKS) {
  const dir = path.join(ROOT, folder)
  const files = await listDir(dir)
  const match = files.find((f) => path.parse(f).name === base)
  if (!match) {
    missing.push(`${folder}/${base}`)
    continue
  }

  const slug = slugify(base)
  const { data, info } = await sharp(path.join(dir, match))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h } = info
  const { cleared } = knockOutBackground(data, w, h)

  const out = path.join(OUT, `${slug}.webp`)
  const result = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({ quality: QUALITY, alphaQuality: 95, effort: 6 })
    .toFile(out)

  slugs.push(slug)
  const kb = (await stat(out)).size / 1024
  report.push({ slug, w: result.width, h: result.height, kb, cleared: (cleared / (w * h)) * 100 })
}

// The component imports this so the two can never drift apart.
await writeFile(
  path.join(OUT, 'index.json'),
  JSON.stringify(slugs.sort(), null, 0) + '\n'
)

for (const r of report) {
  console.log(
    `${(r.slug + '.webp').padEnd(26)} ${String(r.w).padStart(3)}x${String(r.h).padStart(3)}  ` +
      `${r.kb.toFixed(1).padStart(5)}KB  bg-removed:${r.cleared.toFixed(1).padStart(5)}%`
  )
}

if (missing.length) {
  console.log('\nMISSING (fix the name in PICKS):')
  for (const m of missing) console.log('  ' + m)
}

const all = (await readdir(OUT)).filter((f) => f.endsWith('.webp'))
let total = 0
for (const f of all) total += (await stat(path.join(OUT, f))).size
console.log(`\n${all.length} charms, ${(total / 1024).toFixed(0)}KB total`)
