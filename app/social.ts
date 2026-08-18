/**
 * The posts shown in the Join Our Girl Club rail.
 *
 * These are OddlyCraft's own TikTok posts — the shop's content on the shop's
 * site. Thumbnails live in /public/social and were pulled with the post ids
 * below; each card links back to the real post so the view count lands where
 * it should.
 *
 * TO ADD A POST: put its thumbnail in /public/social/<id>.webp and add a row
 * here. To refresh the lot:
 *
 *   python -m yt_dlp --skip-download --write-thumbnail --playlist-end 8 \
 *     -o "public/social/%(id)s.%(ext)s" https://www.tiktok.com/@oddlycraft.mt
 *
 * (then convert the .image files it writes to .webp — yt-dlp needs ffmpeg to
 * do that itself, and it isn't installed here.)
 *
 * CUSTOMER POSTS ARE NOT IN THIS LIST, deliberately — see the note in
 * app/GirlClub.tsx.
 */

export type SocialPost = {
  id: string
  /** Thumbnail under /public/social. */
  src: string
  /** The post itself — every card is a link back to it. */
  href: string
  source: 'TikTok' | 'Instagram'
  /** Short description, used as the image's alt text. */
  caption: string
}

const TT = 'https://www.tiktok.com/@oddlycraft.mt/video'

export const SOCIAL_POSTS: SocialPost[] = [
  { id: '7669922619466222850', src: '/social/7669922619466222850.webp', href: `${TT}/7669922619466222850`, source: 'TikTok', caption: 'Recap from the collab event at the shop' },
  { id: '7669548763723205910', src: '/social/7669548763723205910.webp', href: `${TT}/7669548763723205910`, source: 'TikTok', caption: 'Event day with The Body Shop Malta' },
  { id: '7665462002520837398', src: '/social/7665462002520837398.webp', href: `${TT}/7665462002520837398`, source: 'TikTok', caption: 'A souvenir you make yourself on your Malta trip' },
  { id: '7665335566841498902', src: '/social/7665335566841498902.webp', href: `${TT}/7665335566841498902`, source: 'TikTok', caption: 'Making a custom passport cover in Malta' },
  { id: '7663953352123813142', src: '/social/7663953352123813142.webp', href: `${TT}/7663953352123813142`, source: 'TikTok', caption: 'Building an Italian charm bracelet in the shop' },
  { id: '7663130026707160343', src: '/social/7663130026707160343.webp', href: `${TT}/7663130026707160343`, source: 'TikTok', caption: 'Custom make-up palette pop-up at The Plaza' },
  { id: '7659914971773521174', src: '/social/7659914971773521174.webp', href: `${TT}/7659914971773521174`, source: 'TikTok', caption: 'Decorating your own passport cover' },
]
