/**
 * The drafting look for SVG images: the site's colours (themes/drafting/tokens.css), its three
 * fonts embedded as subsets (an image can't load web fonts), and the sheet frame.
 */

export type Theme = 'light' | 'dark'

export const COLORS = {
  light: {
    bg: '#f2eddb', surface: '#e9e3cd', raised: '#fbf8ee', grid: 'rgb(79 122 58 / 0.1)',
    fg: '#1f2a20', muted: '#55604f', line: '#4f7a3a', secondary: '#6e7236', strong: '#6b5638',
    accent: '#9a7a1e', wash: 'rgb(232 213 106 / 0.55)', soil: '#cdbf98',
  },
  dark: {
    bg: '#111812', surface: '#1b241c', raised: '#212c22', grid: 'rgb(128 181 95 / 0.07)',
    fg: '#ece4c8', muted: '#b9b08c', line: '#80b55f', secondary: '#91964e', strong: '#6b5638',
    accent: '#e8d56a', wash: 'rgb(232 213 106 / 0.28)', soil: '#3a3526',
  },
} as const

export type Colors = (typeof COLORS)[Theme]

/** Full width of a card: GitHub's profile readme column is about 830 px wide. */
export const FULL = 840
/** Two half cards side by side, each shown at 49 % (see readme/README.md). */
export const HALF = 412

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------- fonts ----------

export type Font = 'pixel' | 'mono' | 'sans'

const FAMILIES: Record<Font, { family: string, query: string, fallback: string }> = {
  pixel: { family: 'Jersey 10', query: 'Jersey+10', fallback: 'monospace' },
  mono: { family: 'JetBrains Mono', query: 'JetBrains+Mono:wght@400;700', fallback: 'monospace' },
  sans: { family: 'Schibsted Grotesk', query: 'Schibsted+Grotesk:wght@400;700', fallback: 'sans-serif' },
}

const fontCache = new Map<string, Promise<string>>()

/**
 * @font-face rules for one font with only the characters an image uses, as data URLs. Google Fonts
 * cuts the subset itself (the text parameter). Without network the image falls back to the
 * system's fonts, so a build never fails over it.
 */
async function fontFace(font: Font, text: string): Promise<string> {
  const chars = [...new Set(text)].sort().join('')
  const key = `${font}|${chars}`
  if (!fontCache.has(key)) {
    fontCache.set(key, (async () => {
      const { family, query } = FAMILIES[font]
      try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${query}&text=${encodeURIComponent(chars)}`, {
          // a browser that takes woff2
          headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' },
        })).text()
        const faces = await Promise.all([...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(async ([, block]) => {
          const url = /url\((https:[^)]+)\)/.exec(block!)?.[1]
          const weight = /font-weight:\s*(\d+)/.exec(block!)?.[1] ?? '400'
          if (!url) return ''
          const data = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
          return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`
        }))
        return faces.join('')
      }
      catch (e) {
        console.warn(`[readme] ${family}: falling back to system fonts (${(e as Error).message})`)
        return ''
      }
    })())
  }
  return fontCache.get(key)!
}

/** Text drawn in an image, collected per font so the fonts can be embedded afterwards. */
export class Texts {
  private used: Record<Font, string> = { pixel: '', mono: '', sans: '' }

  /** A <text> element; letters: animate the letters in one by one (typed), from delay, every step ms. */
  text(font: Font, x: number, y: number, content: string, o: { size: number, fill: string, weight?: number, anchor?: 'start' | 'middle' | 'end', cls?: string, delay?: number, letters?: { step: number }, spacing?: number } ) {
    this.used[font] += content
    const { family, fallback } = FAMILIES[font]
    const attrs = [
      `x="${x}"`, `y="${y}"`,
      `font-family="'${family}', ${fallback}"`,
      `font-size="${o.size}"`,
      `fill="${o.fill}"`,
      o.weight ? `font-weight="${o.weight}"` : '',
      o.anchor && o.anchor !== 'start' ? `text-anchor="${o.anchor}"` : '',
      o.spacing ? `letter-spacing="${o.spacing}"` : '',
      o.cls ? `class="${o.cls}"` : '',
      o.delay != null && !o.letters ? `style="animation-delay:${o.delay}ms"` : '',
    ].filter(Boolean).join(' ')
    if (!o.letters) return `<text ${attrs}>${esc(content)}</text>`
    // Typed: one copy of the text per letter, the letters after it there but transparent, so every
    // copy is laid out exactly like the whole text; each copy shows until the next one takes over,
    // the last one stays. Only whole <text> elements are animated: animations on a tspan don't run
    // reliably in an image.
    const step = o.letters.step
    const chars = [...content]
    const start = o.delay ?? 0
    const copies = chars.map((_, i) => {
      if (chars[i] === ' ' && i < chars.length - 1) return ''
      const shown = esc(chars.slice(0, i + 1).join(''))
      const rest = esc(chars.slice(i + 1).join(''))
      const at = start + i * step
      // up to the next copy that is drawn (spaces have none)
      let next = i + 1
      while (next < chars.length - 1 && chars[next] === ' ') next++
      const last = i === chars.length - 1
      const anim = last ? `on 1ms step-end ${at}ms forwards` : `on ${(next - i) * step}ms step-end ${at}ms`
      return `<text ${attrs} class="ty${last ? ' ty-last' : ''}" style="animation:${anim}" xml:space="preserve">${shown}${rest ? `<tspan fill-opacity="0">${rest}</tspan>` : ''}</text>`
    })
    return copies.join('')
  }

  async css() {
    const faces = await Promise.all((Object.keys(this.used) as Font[])
      .filter(f => this.used[f])
      .map(f => fontFace(f, this.used[f])))
    return faces.join('')
  }
}

// ---------- the sheet ----------

/** Animations every image shares; each element names its own delay. Everything plays once. */
const BASE_CSS = `
.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 700ms cubic-bezier(.65,0,.35,1) both}
@keyframes draw{to{stroke-dashoffset:0}}
.fade{animation:fade 400ms steps(4,end) both}
@keyframes fade{from{opacity:0}}
.ty{opacity:0}
@keyframes on{from,to{opacity:1}}
.grow{animation:grow 220ms steps(2,end) both}
@keyframes grow{from{opacity:0}}
/* a discrete change late in an image only sticks as a forwards fill (both stalls after ~1 s in Chrome) */
.gone{animation:gone 1ms step-end forwards}
@keyframes gone{from,to{opacity:0}}
.bloom{animation:bloom 360ms steps(3,end) both;transform-box:fill-box;transform-origin:center}
@keyframes bloom{from{transform:scale(0)}}
.bar{animation:bar 900ms cubic-bezier(.65,0,.35,1) both;transform-box:fill-box;transform-origin:left}
@keyframes bar{from{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.ty-last{opacity:1}.gone{opacity:0}}
`

/**
 * A whole image: the paper with its grid, a frame drawn in around it, and a small annotation in the frame's top edge, like a figure on a drawing.
 */
export async function sheet(o: {
  width: number
  height: number
  theme: Theme
  texts: Texts
  body: string
  /** the annotation in the top edge, e.g. "FIG. 2 · LANGUAGES" */
  label?: string
  /** a title for screen readers */
  title: string
  css?: string
  /** no paper and frame: only the body (the section titles) */
  bare?: boolean
}) {
  const c = COLORS[o.theme]
  const { width: W, height: H } = o
  const label = o.label
    ? `<rect x="22" y="2" width="${o.label.length * 6.6 + 16}" height="12" fill="${c.bg}"/>`
      + o.texts.text('mono', 30, 12, o.label, { size: 10, fill: c.muted, spacing: 0.6, cls: 'fade', delay: 300 })
    : ''
  const frame = o.bare
    ? ''
    : `<defs><pattern id="g" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="${c.grid}"/></pattern></defs>`
      + `<rect width="${W}" height="${H}" fill="${c.bg}"/><rect width="${W}" height="${H}" fill="url(#g)"/>`
      + `<rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" fill="none" stroke="${c.line}" pathLength="1" class="draw"/>`
  const body = `${frame}${o.body}${label}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(o.title)}">`
    + `<title>${esc(o.title)}</title>`
    + `<style>${await o.texts.css()}${BASE_CSS}${o.css ?? ''}</style>${body}</svg>`
}

// ---------- measuring ----------

/** Advance widths of one font weight: per character, in em. */
interface Metrics { advance: Map<number, number>, fallback: number, capHeight: number, xHeight: number }
const metrics = new Map<string, Metrics>()

/**
 * Loads the fonts' real glyph widths, so text can be centred, followed and wrapped exactly. Google
 * Fonts hands plain TrueType to a client without a user agent; only its cmap and hmtx are read.
 * Without network, measure() falls back to an average width per font.
 */
export async function loadMetrics() {
  try {
    const query = (Object.keys(FAMILIES) as Font[]).map(f => `family=${FAMILIES[f].query}`).join('&')
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`, { headers: { 'user-agent': '' } })).text()
    await Promise.all([...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(async ([, block]) => {
      const family = /font-family:\s*'([^']+)'/.exec(block!)?.[1]
      const weight = /font-weight:\s*(\d+)/.exec(block!)?.[1] ?? '400'
      const url = /url\((https:[^)]+\.ttf)\)/.exec(block!)?.[1]
      if (!family || !url) return
      metrics.set(`${family} ${weight}`, readMetrics(new DataView(await (await fetch(url)).arrayBuffer())))
    }))
  }
  catch (e) {
    console.warn(`[readme] font widths unknown, estimating (${(e as Error).message})`)
  }
}

/** Reads the advance width of every character in a TrueType font's cmap (format 4) from its hmtx. */
function readMetrics(v: DataView): Metrics {
  const tables = new Map<string, number>()
  for (let i = 0; i < v.getUint16(4); i++) {
    const r = 12 + i * 16
    tables.set(String.fromCharCode(v.getUint8(r), v.getUint8(r + 1), v.getUint8(r + 2), v.getUint8(r + 3)), v.getUint32(r + 8))
  }
  const upem = v.getUint16(tables.get('head')! + 18)
  const hMetrics = v.getUint16(tables.get('hhea')! + 34)
  const hmtx = tables.get('hmtx')!
  const width = (glyph: number) => v.getUint16(hmtx + 4 * Math.min(glyph, hMetrics - 1)) / upem

  const cmap = tables.get('cmap')!
  let sub = 0
  for (let i = 0; i < v.getUint16(cmap + 2); i++) {
    const r = cmap + 4 + i * 8
    const offset = cmap + v.getUint32(r + 4)
    if (v.getUint16(offset) === 4) sub = offset
  }
  const advance = new Map<number, number>()
  if (sub) {
    const segs = v.getUint16(sub + 6) / 2
    const ends = sub + 14
    const starts = ends + segs * 2 + 2
    const deltas = starts + segs * 2
    const ranges = deltas + segs * 2
    for (let s = 0; s < segs; s++) {
      const end = v.getUint16(ends + s * 2)
      const start = v.getUint16(starts + s * 2)
      const delta = v.getInt16(deltas + s * 2)
      const range = v.getUint16(ranges + s * 2)
      for (let ch = start; ch <= end && ch !== 0xFFFF; ch++) {
        let glyph: number
        if (range === 0) glyph = (ch + delta) & 0xFFFF
        else {
          const g = v.getUint16(ranges + s * 2 + range + (ch - start) * 2)
          glyph = g === 0 ? 0 : (g + delta) & 0xFFFF
        }
        if (glyph) advance.set(ch, width(glyph))
      }
    }
  }
  // OS/2 version 2 and up says how tall the capitals are
  const os2 = tables.get('OS/2')
  const v2 = os2 != null && v.getUint16(os2) >= 2
  const capHeight = v2 ? v.getInt16(os2 + 88) / upem : 0.7
  const xHeight = v2 ? v.getInt16(os2 + 86) / upem : 0.5
  return { advance, fallback: advance.get(0x6E) ?? 0.5, capHeight, xHeight }
}

/** Width of a string in px, from the font's glyph widths (an estimate when they could not be loaded). */
export function measure(font: Font, s: string, size: number, o: { weight?: number, spacing?: number } = {}) {
  const m = metrics.get(`${FAMILIES[font].family} ${o.weight ?? 400}`)
  const chars = [...s]
  const spacing = (o.spacing ?? 0) * chars.length
  if (!m) return chars.length * size * (font === 'mono' ? 0.6 : font === 'pixel' ? 0.42 : 0.52) + spacing
  return chars.reduce((w, ch) => w + (m.advance.get(ch.codePointAt(0)!) ?? m.fallback), 0) * size + spacing
}

/** How far the capitals reach above the baseline, in px. */
export function capHeight(font: Font, size: number, weight = 400) {
  return (metrics.get(`${FAMILIES[font].family} ${weight}`)?.capHeight ?? 0.7) * size
}

/** How tall the lowercase letters are, in px. */
export function xHeight(font: Font, size: number, weight = 400) {
  return (metrics.get(`${FAMILIES[font].family} ${weight}`)?.xHeight ?? 0.5) * size
}

/** Words to lines no wider than width. */
export function wrap(font: Font, s: string, size: number, width: number, maxLines = 99, weight?: number) {
  const lines: string[] = []
  let line = ''
  for (const word of s.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (measure(font, next, size, { weight }) > width && line) {
      lines.push(line)
      line = word
    }
    else line = next
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines)
    cut[maxLines - 1] = `${cut[maxLines - 1]!.replace(/\s+\S*$/, '')} …`
    return cut
  }
  return lines
}
