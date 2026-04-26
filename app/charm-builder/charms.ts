export interface Charm {
  id: string; name: string; emoji: string
  category: string; price: number; bg: string
  imageUrl?: string   // uploaded image — overrides emoji display when present
}

export const CATEGORIES = ['Nature','Symbols','Lifestyle','Letters','Zodiac'] as const

export const DEFAULT_CHARMS: Charm[] = [
  // Nature
  { id:'blossom',    name:'Blossom',    emoji:'🌸', category:'Nature',    price:3.50, bg:'#FFD6E7' },
  { id:'butterfly',  name:'Butterfly',  emoji:'🦋', category:'Nature',    price:3.50, bg:'#D6E8FF' },
  { id:'moon',       name:'Moon',       emoji:'🌙', category:'Nature',    price:3.50, bg:'#FFF5CC' },
  { id:'star',       name:'Star',       emoji:'⭐', category:'Nature',    price:3.50, bg:'#FFF3B0' },
  { id:'rose',       name:'Rose',       emoji:'🌹', category:'Nature',    price:3.50, bg:'#FFD6E7' },
  { id:'clover',     name:'Clover',     emoji:'🍀', category:'Nature',    price:3.50, bg:'#D4F5D4' },
  { id:'wave',       name:'Ocean Wave', emoji:'🌊', category:'Nature',    price:3.50, bg:'#B8E4FF' },
  { id:'snowflake',  name:'Snowflake',  emoji:'❄️', category:'Nature',    price:3.50, bg:'#E0F4FF' },
  { id:'sun',        name:'Sunshine',   emoji:'☀️', category:'Nature',    price:3.50, bg:'#FFF3B0' },
  { id:'rainbow',    name:'Rainbow',    emoji:'🌈', category:'Nature',    price:3.50, bg:'#F0F8FF' },
  // Symbols
  { id:'heart',      name:'Heart',      emoji:'❤️', category:'Symbols',   price:3.50, bg:'#FFD6E7' },
  { id:'crystal',    name:'Crystal',    emoji:'🔮', category:'Symbols',   price:4.50, bg:'#E8D6FF' },
  { id:'key',        name:'Key',        emoji:'🗝️', category:'Symbols',   price:3.50, bg:'#F5DEB3' },
  { id:'infinity',   name:'Infinity',   emoji:'♾️', category:'Symbols',   price:3.50, bg:'#D6E8FF' },
  { id:'lightning',  name:'Lightning',  emoji:'⚡', category:'Symbols',   price:3.50, bg:'#FFF3B0' },
  { id:'crown',      name:'Crown',      emoji:'👑', category:'Symbols',   price:4.50, bg:'#FFF3B0' },
  { id:'anchor',     name:'Anchor',     emoji:'⚓', category:'Symbols',   price:3.50, bg:'#B8E4FF' },
  { id:'peace',      name:'Peace',      emoji:'☮️', category:'Symbols',   price:3.50, bg:'#D4F5D4' },
  { id:'diamond',    name:'Diamond',    emoji:'💎', category:'Symbols',   price:4.50, bg:'#D6F0FF' },
  { id:'goldkey',    name:'Gold Key',   emoji:'🔑', category:'Symbols',   price:3.50, bg:'#FFF3B0' },
  // Lifestyle
  { id:'music',      name:'Music',      emoji:'🎵', category:'Lifestyle', price:3.50, bg:'#E8D6FF' },
  { id:'travel',     name:'Airplane',   emoji:'✈️', category:'Lifestyle', price:3.50, bg:'#B8E4FF' },
  { id:'camera',     name:'Camera',     emoji:'📸', category:'Lifestyle', price:3.50, bg:'#E0E0E0' },
  { id:'art',        name:'Art',        emoji:'🎨', category:'Lifestyle', price:3.50, bg:'#FFD6E7' },
  { id:'coffee',     name:'Coffee',     emoji:'☕', category:'Lifestyle', price:3.50, bg:'#D4A882' },
  { id:'book',       name:'Book',       emoji:'📚', category:'Lifestyle', price:3.50, bg:'#D4E8D4' },
  { id:'pizza',      name:'Pizza',      emoji:'🍕', category:'Lifestyle', price:3.50, bg:'#FFD6A0' },
  { id:'headphones', name:'Headphones', emoji:'🎧', category:'Lifestyle', price:3.50, bg:'#E8D6FF' },
  { id:'gaming',     name:'Gaming',     emoji:'🎮', category:'Lifestyle', price:3.50, bg:'#D6E8FF' },
  { id:'cat',        name:'Cat',        emoji:'🐱', category:'Lifestyle', price:3.50, bg:'#FFE8CC' },
  // Letters A-Z
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({
    id:`letter-${l}`, name:`Letter ${l}`, emoji:l,
    category:'Letters', price:2.50, bg:'#F0E8FF',
  })),
  // Zodiac
  { id:'aries',       name:'Aries',       emoji:'♈', category:'Zodiac', price:3.50, bg:'#FFD6E7' },
  { id:'taurus',      name:'Taurus',      emoji:'♉', category:'Zodiac', price:3.50, bg:'#D4F5D4' },
  { id:'gemini',      name:'Gemini',      emoji:'♊', category:'Zodiac', price:3.50, bg:'#FFF3B0' },
  { id:'cancer',      name:'Cancer',      emoji:'♋', category:'Zodiac', price:3.50, bg:'#B8E4FF' },
  { id:'leo',         name:'Leo',         emoji:'♌', category:'Zodiac', price:3.50, bg:'#FFD6A0' },
  { id:'virgo',       name:'Virgo',       emoji:'♍', category:'Zodiac', price:3.50, bg:'#D4F5D4' },
  { id:'libra',       name:'Libra',       emoji:'♎', category:'Zodiac', price:3.50, bg:'#E8D6FF' },
  { id:'scorpio',     name:'Scorpio',     emoji:'♏', category:'Zodiac', price:3.50, bg:'#FFD6E7' },
  { id:'sagittarius', name:'Sagittarius', emoji:'♐', category:'Zodiac', price:3.50, bg:'#FFF3B0' },
  { id:'capricorn',   name:'Capricorn',   emoji:'♑', category:'Zodiac', price:3.50, bg:'#D6E8FF' },
  { id:'aquarius',    name:'Aquarius',    emoji:'♒', category:'Zodiac', price:3.50, bg:'#B8E4FF' },
  { id:'pisces',      name:'Pisces',      emoji:'♓', category:'Zodiac', price:3.50, bg:'#E8D6FF' },
]