/**
 * Re-canvases every Letter charm photo so they all render at the same visual
 * size in the builder palette.
 *
 * The palette draws each photo with `object-fit: contain` into a fixed-height
 * box, so apparent size is governed by (subject height / canvas height), not by
 * the file's pixel dimensions. The supplier photos vary from 74% to 96.5% —
 * Letter A in particular sat in a canvas with 42% empty padding and rendered
 * noticeably smaller than its neighbours.
 *
 * This trims each photo to the charm itself, then re-pads it so the subject
 * occupies exactly SUBJECT_RATIO of the canvas height with an equal margin all
 * round. Pixels are never resampled, so no sharpness is lost.
 *
 * Re-run after adding a new letter photo:  node scripts/normalize-letter-images.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const DIR = 'public/charms/italian'
const SUBJECT_RATIO = 0.94   // charm height as a fraction of canvas height
const TRIM_THRESHOLD = 10    // alpha/colour tolerance when finding the charm edge

// Silver links icy001–icy026 (no icy002 — that photo is a contact sheet, not a B)
// and gold plaques icy974–icy996.
const SILVER = Array.from({ length: 26 }, (_, i) => `icy${String(i + 1).padStart(3, '0')}`)
  .filter(n => n !== 'icy002')
const GOLD = Array.from({ length: 23 }, (_, i) => `icy${974 + i}`)

async function normalize(name) {
  const file = path.join(DIR, `${name}.png`)
  const before = await sharp(file).metadata()

  // Trim transparent/flat border down to the charm itself.
  const trimmed = await sharp(file)
    .trim({ threshold: TRIM_THRESHOLD })
    .png()
    .toBuffer({ resolveWithObject: true })

  const { width: sw, height: sh } = trimmed.info
  const margin = Math.round((sh / SUBJECT_RATIO - sh) / 2)

  const out = await sharp(trimmed.data)
    .extend({
      top: margin, bottom: margin, left: margin, right: margin,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await fs.writeFile(file, out)
  const after = await sharp(out).metadata()
  return {
    name,
    from: `${before.width}x${before.height}`,
    to: `${after.width}x${after.height}`,
    ratioBefore: (sh / before.height).toFixed(3),
    ratioAfter: (sh / after.height).toFixed(3),
  }
}

for (const [label, set] of [['silver links', SILVER], ['gold plaques', GOLD]]) {
  console.log(`\n=== ${label} ===`)
  for (const name of set) {
    const r = await normalize(name)
    const flag = Number(r.ratioBefore) < 0.88 ? '  <-- was undersized' : ''
    console.log(`${r.name}  ${r.from.padEnd(9)} -> ${r.to.padEnd(9)}  fill ${r.ratioBefore} -> ${r.ratioAfter}${flag}`)
  }
}
