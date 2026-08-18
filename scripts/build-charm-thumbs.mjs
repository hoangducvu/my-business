/**
 * Builds the small WebP thumbnails the charm builder actually displays.
 *
 * The supplier photos in public/charms/italian are ~360px PNGs averaging 107KB,
 * and the builder draws them into a 62px-tall box (28px on mobile). Opening the
 * Nature tab pulled ~3.3MB down the wire to fill a strip of thumbnails; the
 * whole catalogue is 18.9MB.
 *
 * These thumbnails are committed to the repo, so nothing here runs at build or
 * request time — Netlify just serves the files. Transparency is preserved so the
 * charms still sit on the palette's grey tile.
 *
 * Re-run after adding or re-shooting a charm photo:
 *   node scripts/build-charm-thumbs.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const SRC = 'public/charms/italian'
const OUT = 'public/charms/thumbs'
const WIDTH = 176   // ~2.8x the 62px display box, so it stays sharp on retina
const QUALITY = 82

const kb = (n) => (n / 1024).toFixed(1) + 'KB'

const files = (await fs.readdir(SRC)).filter((f) => f.endsWith('.png'))
await fs.mkdir(OUT, { recursive: true })

let srcTotal = 0
let outTotal = 0

for (const file of files) {
  const from = path.join(SRC, file)
  const to = path.join(OUT, file.replace(/\.png$/, '.webp'))

  await sharp(from)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: 90 })
    .toFile(to)

  srcTotal += (await fs.stat(from)).size
  outTotal += (await fs.stat(to)).size
}

console.log(`${files.length} thumbnails written to ${OUT}`)
console.log(`  ${kb(srcTotal)} of PNG  ->  ${kb(outTotal)} of WebP`)
console.log(`  ${(100 - (outTotal / srcTotal) * 100).toFixed(1)}% smaller`)
