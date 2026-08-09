export interface Charm {
  id: string; name: string; emoji: string
  category: string; price: number; bg: string
  tone: Tone            // which bracelet finish this charm belongs to
  imageUrl?: string     // product photo — shown instead of emoji when present
  special?: boolean     // premium charm — adds €2 to whatever the build costs
}

export type Tone = 'silver' | 'gold'

export const CATEGORIES = ['Nature','Symbols','Lifestyle','Letters','Words'] as const

/**
 * Charms kept out of the public shop without touching the inventory sheet.
 * They stay listed (and stock-editable) in /admin — only the customer-facing
 * palette skips them.
 *
 * it-icy013 (Letter M): the supplied photo is a bare gold letter with no
 * charm-link body, so it looks nothing like the other 47 letters. Remove this
 * id once the piece has been reshot, then re-run
 * scripts/normalize-letter-images.mjs.
 */
export const HIDDEN_CHARM_IDS = new Set<string>(['it-icy013'])

/**
 * Palette-sized version of a charm photo.
 *
 * The builder never draws a charm bigger than ~62px, so it loads the WebP
 * thumbnails built by `scripts/build-charm-thumbs.mjs` (~6KB) rather than the
 * supplier PNGs (~107KB each). A charm added through /admin with its own image
 * URL has no thumbnail and is returned unchanged.
 */
export function thumbUrl(url: string): string
export function thumbUrl(url: string | undefined): string | undefined
export function thumbUrl(url: string | undefined): string | undefined {
  if (!url) return url
  const match = /^\/charms\/italian\/(.+)\.png$/.exec(url)
  return match ? `/charms/thumbs/${match[1]}.webp` : url
}

/** Every charm is a real catalogue piece with a photo; there are no emoji placeholders. */
export const CHARMS: Charm[] = [
  // ── Nature ────────────────────────────────────────────
  { id:'it-icj704-2', name:"Crescent Moon Stars Gold", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj704-2.png' },
  { id:'it-icj367-2', name:"Daisy Flower", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj367-2.png' },
  { id:'it-icj048-1', name:"Gold Star", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj048-1.png' },
  { id:'it-icj960-2', name:"Great Wave Gold", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj960-2.png' },
  { id:'it-icj362-2', name:"Green Clover", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#D4F5D4', imageUrl:'/charms/italian/icj362-2.png' },
  { id:'it-icj167-2', name:"Hibiscus Flower", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj167-2.png' },
  { id:'it-icj571-2', name:"Palm Tree Sunset II", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#FFD6A0', imageUrl:'/charms/italian/icj571-2.png' },
  { id:'it-icj146-1', name:"Pearl Butterfly", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj146-1.png' },
  { id:'it-icj3122', name:"Pink Starfish Gold", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj3122.png' },
  { id:'it-icj847', name:"Red Rose", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj847.png' },
  { id:'it-icj1434', name:"Starfish & Shell", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#F5DEB3', imageUrl:'/charms/italian/icj1434.png' },
  { id:'it-icj1094-2', name:"Starry Night", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj1094-2.png' },
  { id:'it-icj1140', name:"Tropical Island", emoji:'', category:'Nature', tone:'gold', price:3.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj1140.png' },
  { id:'it-icj1774', name:"Beach Heart", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj1774.png' },
  { id:'it-icj2692', name:"Blue Butterfly", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj2692.png' },
  { id:'it-icp-yc448-12', name:"Butterfly Print Pink", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-yc448-12.png' },
  { id:'it-icp-yc448-14', name:"Cherry Blossom Print", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-yc448-14.png' },
  { id:'it-icj1760', name:"Coastal Sunset", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj1760.png' },
  { id:'it-icj687', name:"Crescent Moon Burst", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj687.png' },
  { id:'it-icj704', name:"Crescent Moon Stars", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj704.png' },
  { id:'it-icj873', name:"Daisy Gem", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj873.png' },
  { id:'it-icj960', name:"Great Wave", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj960.png' },
  { id:'it-icp-yc448-15', name:"Hibiscus Print Pink", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-yc448-15.png' },
  { id:'it-icp-yc435-5', name:"Hibiscus Print Red", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icp-yc435-5.png' },
  { id:'it-icj571', name:"Palm Tree Sunset", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6A0', imageUrl:'/charms/italian/icj571.png' },
  { id:'it-icp-yc452-9', name:"Pink Star Print", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-yc452-9.png' },
  { id:'it-icj3122-1', name:"Pink Starfish Silver", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj3122-1.png' },
  { id:'it-icj3160', name:"Saturn Planet", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj3160.png' },
  { id:'it-icj959', name:"Sea Turtle", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj959.png' },
  { id:'it-icj707', name:"Star Charm Black", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj707.png' },
  { id:'it-icj590', name:"Tropical Fish Tank", emoji:'', category:'Nature', tone:'silver', price:3.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj590.png' },
  // ── Symbols ───────────────────────────────────────────
  { id:'it-icj3239-6', name:"Blue Flower Gem", emoji:'', category:'Symbols', tone:'gold', price:4.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj3239-6.png' },
  { id:'it-icy719-2', name:"Clear Heart Crystal Gold", emoji:'', category:'Symbols', tone:'gold', price:4.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icy719-2.png' },
  { id:'it-icj578-1', name:"Evil Eye Blue", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj578-1.png' },
  { id:'it-icj612', name:"Evil Eye Burst", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj612.png' },
  { id:'it-icj1088-2', name:"Evil Eye Heart Black", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj1088-2.png' },
  { id:'it-icj1253', name:"Evil Eye Heart Gold", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj1253.png' },
  { id:'it-icj1042', name:"Evil Eye Heart Red", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj1042.png' },
  { id:'it-icj1042-2', name:"Evil Eye Heart Red II", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj1042-2.png' },
  { id:'it-icj2286', name:"Heart Sunburst Gold", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj2286.png' },
  { id:'it-icj2283', name:"Heart Sunburst Navy", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj2283.png' },
  { id:'it-icj673-2', name:"Jesus Heart Plaque", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj673-2.png' },
  { id:'it-icj1789', name:"Jesus Saves Cross", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj1789.png' },
  { id:'it-icj3238-5', name:"Pink Flower Gem", emoji:'', category:'Symbols', tone:'gold', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj3238-5.png' },
  { id:'it-icy1399-2', name:"Pink Heart Crystal Gold", emoji:'', category:'Symbols', tone:'gold', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icy1399-2.png' },
  { id:'it-icj737', name:"Red Heart Classic", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj737.png' },
  { id:'it-icj737-2', name:"Red Heart Classic II", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj737-2.png' },
  { id:'it-icy721-2', name:"Red Heart Crystal Gold", emoji:'', category:'Symbols', tone:'gold', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icy721-2.png' },
  { id:'it-icj672-2', name:"Spider Charm", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj672-2.png' },
  { id:'it-icj580-1', name:"Star Burst Blue", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj580-1.png' },
  { id:'it-icp-jhaa0001-2', name:"Swan Love Heart Gold", emoji:'', category:'Symbols', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jhaa0001-2.png' },
  { id:'it-icj700', name:"Bat Charm", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj700.png' },
  { id:'it-icj162', name:"Cupid's Arrow Heart", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj162.png' },
  { id:'it-icj1478-6', name:"Denim Blue Heart Gem", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj1478-6.png' },
  { id:'it-icp-yc447-9', name:"Evil Eye Print", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icp-yc447-9.png' },
  { id:'it-icj016-1', name:"Fuchsia Pave Sparkle", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj016-1.png' },
  { id:'it-icj016-2', name:"Lilac Pave Sparkle", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#E8D6FF', imageUrl:'/charms/italian/icj016-2.png' },
  { id:'it-icj1062', name:"Lucky Charms Cluster", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj1062.png' },
  { id:'it-icj1478-4', name:"Pink Heart Gem", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj1478-4.png' },
  { id:'it-icj2422', name:"Pink Oval Gem", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj2422.png' },
  { id:'it-icj2529', name:"Pink Winged Heart", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj2529.png' },
  { id:'it-icj2425', name:"Red Gothic Heart", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj2425.png' },
  { id:'it-icj380', name:"Skull & Crossbones", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj380.png' },
  { id:'it-icj165-1', name:"Sky Blue Oval Gem", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj165-1.png' },
  { id:'it-icj705', name:"Spiderweb Charm", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj705.png' },
  { id:'it-icj594', name:"Star Burst Cobalt", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#D6E8FF', imageUrl:'/charms/italian/icj594.png' },
  { id:'it-icj212-1', name:"Star Burst Plaque", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj212-1.png' },
  { id:'it-icj682', name:"Star Burst Silver Blue", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj682.png' },
  { id:'it-icp-jhaa0001-1', name:"Swan Love Heart", emoji:'', category:'Symbols', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jhaa0001-1.png' },
  { id:'it-icj1478-2', name:"Turquoise Heart Gem", emoji:'', category:'Symbols', tone:'silver', price:4.50, bg:'#B8E4FF', imageUrl:'/charms/italian/icj1478-2.png' },
  // ── Lifestyle ─────────────────────────────────────────
  { id:'it-icj3664', name:"Airplane Brushed Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj3664.png' },
  { id:'it-icj3665', name:"Airplane Crystal Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj3665.png' },
  { id:'it-icj3237', name:"Airplane Pearl Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj3237.png' },
  { id:'it-icj1151-2', name:"Black Teddy Bear", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj1151-2.png' },
  { id:'it-icj092', name:"Bunny Silhouette", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj092.png' },
  { id:'it-icj520-2', name:"Camera Charm Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj520-2.png' },
  { id:'it-icj3194-2', name:"Cool Cat Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj3194-2.png' },
  { id:'it-icj524-1', name:"Devil Hello Kitty", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj524-1.png' },
  { id:'it-icj666-2', name:"Eight Ball Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj666-2.png' },
  { id:'it-icj481-1', name:"Four Aces", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj481-1.png' },
  { id:'it-icj1152-3', name:"Gold Teddy Bear", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj1152-3.png' },
  { id:'it-icj031-2', name:"Martini Cocktail", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj031-2.png' },
  { id:'it-icj588-1', name:"Motorcycle Charm", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj588-1.png' },
  { id:'it-icj578-2', name:"Paw Print Ivory", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj578-2.png' },
  { id:'it-icj1152', name:"Pink Teddy Bear", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj1152.png' },
  { id:'it-icj1152-2', name:"Pink Teddy Bear II", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj1152-2.png' },
  { id:'it-icj738-2', name:"Poker Hand Gold", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj738-2.png' },
  { id:'it-icj738', name:"Poker Hand Silver", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj738.png' },
  { id:'it-icj2816-2', name:"Red Bull Charm", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFD6A0', imageUrl:'/charms/italian/icj2816-2.png' },
  { id:'it-icj485', name:"Red Chili Pepper", emoji:'', category:'Lifestyle', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj485.png' },
  { id:'it-icj3237-1', name:"Airplane Pearl Silver", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj3237-1.png' },
  { id:'it-icj864-1', name:"Black Cat Moonlight", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj864-1.png' },
  { id:'it-icj520', name:"Camera Charm", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#E0E0E0', imageUrl:'/charms/italian/icj520.png' },
  { id:'it-icj617-1', name:"Card Suits", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj617-1.png' },
  { id:'it-icj3194', name:"Cool Cat White", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj3194.png' },
  { id:'it-icj2287', name:"Dollar Bill", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#D4F5D4', imageUrl:'/charms/italian/icj2287.png' },
  { id:'it-icp-yc421', name:"Eight Ball Photo Print", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icp-yc421.png' },
  { id:'it-icj666', name:"Eight Ball Silver", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj666.png' },
  { id:'it-icj2478', name:"Hello Kitty Apple", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj2478.png' },
  { id:'it-icj2430', name:"Hundred Dollar Bill", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#D4F5D4', imageUrl:'/charms/italian/icj2430.png' },
  { id:'it-icp-yc452-13', name:"Long Day Dachshund", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#FFD6F0', imageUrl:'/charms/italian/icp-yc452-13.png' },
  { id:'it-icj3162', name:"Music Note Stars", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj3162.png' },
  { id:'it-icj2523', name:"Music Notes", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj2523.png' },
  { id:'it-icj1565', name:"Panda Bear", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj1565.png' },
  { id:'it-icj578', name:"Paw Print Cream", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#F5DEB3', imageUrl:'/charms/italian/icj578.png' },
  { id:'it-icp-yc427', name:"Spider Mask Pink", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-yc427.png' },
  { id:'it-icj634', name:"Zebra Print", emoji:'', category:'Lifestyle', tone:'silver', price:3.50, bg:'#E0E0E0', imageUrl:'/charms/italian/icj634.png' },
  // ── Letters ───────────────────────────────────────────
  { id:'it-icy974', name:"Letter A Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy974.png' },
  { id:'it-icy975', name:"Letter B Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy975.png' },
  { id:'it-icy976', name:"Letter C Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy976.png' },
  { id:'it-icy977', name:"Letter D Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy977.png' },
  { id:'it-icy978', name:"Letter E Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy978.png' },
  { id:'it-icy979', name:"Letter F Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy979.png' },
  { id:'it-icy980', name:"Letter G Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy980.png' },
  { id:'it-icy981', name:"Letter H Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy981.png' },
  { id:'it-icy982', name:"Letter I Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy982.png' },
  { id:'it-icy983', name:"Letter J Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy983.png' },
  { id:'it-icy984', name:"Letter K Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy984.png' },
  { id:'it-icy985', name:"Letter L Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy985.png' },
  { id:'it-icy986', name:"Letter M Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy986.png' },
  { id:'it-icy987', name:"Letter N Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy987.png' },
  { id:'it-icy988', name:"Letter O Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy988.png' },
  { id:'it-icy989', name:"Letter P Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy989.png' },
  { id:'it-icy990', name:"Letter Q Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy990.png' },
  { id:'it-icy991', name:"Letter R Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy991.png' },
  { id:'it-icy992', name:"Letter S Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy992.png' },
  { id:'it-icy993', name:"Letter T Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy993.png' },
  { id:'it-icy994', name:"Letter U Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy994.png' },
  { id:'it-icy995', name:"Letter V Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy995.png' },
  { id:'it-icy996', name:"Letter W Gold Plaque", emoji:'', category:'Letters', tone:'gold', price:2.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icy996.png' },
  { id:'it-icy001', name:"Letter A", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy001.png' },
  { id:'it-icy003', name:"Letter C", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy003.png' },
  { id:'it-icy004', name:"Letter D", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy004.png' },
  { id:'it-icy005', name:"Letter E", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy005.png' },
  { id:'it-icy006', name:"Letter F", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy006.png' },
  { id:'it-icy007', name:"Letter G", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy007.png' },
  { id:'it-icy008', name:"Letter H", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy008.png' },
  { id:'it-icy009', name:"Letter I", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy009.png' },
  { id:'it-icy010', name:"Letter J", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy010.png' },
  { id:'it-icy011', name:"Letter K", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy011.png' },
  { id:'it-icy012', name:"Letter L", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy012.png' },
  { id:'it-icy013', name:"Letter M", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy013.png' },
  { id:'it-icy014', name:"Letter N", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy014.png' },
  { id:'it-icy015', name:"Letter O", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy015.png' },
  { id:'it-icy016', name:"Letter P", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy016.png' },
  { id:'it-icy017', name:"Letter Q", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy017.png' },
  { id:'it-icy018', name:"Letter R", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy018.png' },
  { id:'it-icy019', name:"Letter S", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy019.png' },
  { id:'it-icy020', name:"Letter T", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy020.png' },
  { id:'it-icy021', name:"Letter U", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy021.png' },
  { id:'it-icy022', name:"Letter V", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy022.png' },
  { id:'it-icy023', name:"Letter W", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy023.png' },
  { id:'it-icy024', name:"Letter X", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy024.png' },
  { id:'it-icy025', name:"Letter Y", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy025.png' },
  { id:'it-icy026', name:"Letter Z", emoji:'', category:'Letters', tone:'silver', price:2.50, bg:'#F0E8FF', imageUrl:'/charms/italian/icy026.png' },
  // ── Words ─────────────────────────────────────────────
  { id:'it-icj450-2', name:"Always In My Heart Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj450-2.png' },
  { id:'it-icj267-2', name:"Bitch Plaque Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj267-2.png' },
  { id:'it-icj208-2', name:"Crazy Red Plaque Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj208-2.png' },
  { id:'it-icp-jcaa0115-2', name:"Cry A Lot Stripe Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jcaa0115-2.png' },
  { id:'it-icj231', name:"Family Heart Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj231.png' },
  { id:'it-icj1518-2', name:"Freak Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj1518-2.png' },
  { id:'it-icj798-1', name:"I Love My Life Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj798-1.png' },
  { id:'it-icj797-1', name:"I Love Sex Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj797-1.png' },
  { id:'it-icj921', name:"I Love To Travel Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#F5DEB3', imageUrl:'/charms/italian/icj921.png' },
  { id:'it-icj1063-2', name:"Love Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj1063-2.png' },
  { id:'it-icp-jcaa0109-2', name:"Pretty Cool Cry A Lot Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jcaa0109-2.png' },
  { id:'it-icj587-1', name:"Shit Happens Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFF3B0', imageUrl:'/charms/italian/icj587-1.png' },
  { id:'it-icj255-1', name:"Sister Plaque", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#F5DEB3', imageUrl:'/charms/italian/icj255-1.png' },
  { id:'it-icj629-2', name:"You Are Worth It Gold", emoji:'', category:'Words', tone:'gold', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj629-2.png' },
  { id:'it-icj450', name:"Always In My Heart", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj450.png' },
  { id:'it-icj267', name:"Bitch Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj267.png' },
  { id:'it-icj593', name:"Boss Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj593.png' },
  { id:'it-icj119', name:"Crazy Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#D8D8D8', imageUrl:'/charms/italian/icj119.png' },
  { id:'it-icj208', name:"Crazy Red Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj208.png' },
  { id:'it-icp-jcaa0115-1', name:"Cry A Lot Stripe", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jcaa0115-1.png' },
  { id:'it-icj1944', name:"I Hate Men Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj1944.png' },
  { id:'it-icj110-1', name:"I Lost My Mind Plaque", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj110-1.png' },
  { id:'it-icj110-2', name:"I Lost My Mind Plaque II", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#F0F8FF', imageUrl:'/charms/italian/icj110-2.png' },
  { id:'it-icp-jcaa0109-1', name:"Pretty Cool Cry A Lot", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icp-jcaa0109-1.png' },
  { id:'it-icj629-1', name:"You Are Worth It", emoji:'', category:'Words', tone:'silver', price:3.50, bg:'#FFD6E7', imageUrl:'/charms/italian/icj629-1.png' },
]
