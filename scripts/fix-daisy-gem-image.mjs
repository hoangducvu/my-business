/**
 * The Daisy Gem (icj873) supplier photo is softer and duller than every other
 * charm in the catalogue: its highlights clip at 251 instead of 255, so the
 * silver reads as dirty grey, and the petal detail is mushy.
 *
 * This stretches the levels back to full range and applies an unsharp mask.
 * Run once — it rewrites the file in place. Originals are in /charm-originals.
 */
import sharp from 'sharp'

const FILE = 'public/charms/italian/icj873.png'

const before = await sharp(FILE).stats()
const out = await sharp(FILE)
  .normalise({ lower: 1, upper: 99 })
  .sharpen({ sigma: 1.2, m1: 0.5, m2: 2.5 })
  .png({ compressionLevel: 9 })
  .toBuffer()

const { default: fs } = await import('node:fs/promises')
await fs.writeFile(FILE, out)

const after = await sharp(FILE).stats()
const hi = s => s.channels.slice(0, 3).map(c => c.max).join(',')
console.log(`highlights ${hi(before)} -> ${hi(after)}`)
