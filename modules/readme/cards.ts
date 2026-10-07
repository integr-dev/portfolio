import { growBush, rng } from '../../app/themes/drafting/bush'
import { pixelPaths } from '../../app/utils/pixelPaths'
import type { ReadmeData } from './data'
import { COLORS, FULL, HALF, Texts, capHeight, measure, sheet, wrap, xHeight } from './svg'
import type { Colors, Theme } from './svg'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const day = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m! - 1]} ${y}`
}
const num = (n: number) => n.toLocaleString('en-US')

/** Colours for the language bar, in order: greens and browns of the drafting palette. */
const SERIES: Record<Theme, string[]> = {
  light: ['#4f7a3a', '#9a7a1e', '#6ca049', '#6b5638', '#b5b641', '#2c5a2c', '#a39c84'],
  dark: ['#80b55f', '#e8d56a', '#4f7a3a', '#b08a5a', '#b5b641', '#91964e', '#6b6650'],
}

// ---------- header ----------

/** The butterfly from the avatar (ButterflySprite.vue). */
const BUTTERFLY = ['...B.B...', 'YY..B..YY', 'YYY.B.YYY', 'YYYYBYYYY', '.YYYBYYY.', '..YYBYY..', '.YY.B.YY.', '.Y.....Y.']

function butterfly(c: Colors, px: number) {
  const cells = BUTTERFLY.flatMap((row, y) => [...row].map((ch, x) => ({ x, y, ch })).filter(p => p.ch !== '.'))
  const rects = (ch: string) => pixelPaths(cells.filter(p => p.ch === ch).map(p => ({ x: p.x, y: p.y, color: '', delay: 0 })))[0]?.d ?? ''
  return `<g transform="scale(${px})"><path class="wing" d="${rects('Y')}" fill="${c.accent}"/><path d="${rects('B')}" fill="${c.fg}"/></g>`
}

/** A bush of the site (PixelBush.vue) at px CSS px per bush pixel, its corner at 0, 0, growing from delay. */
function bush(o: { seed: number, width: number, height: number, thickness: number, px: number, delay: number, mound?: number }) {
  const { cells, flowers } = growBush({ patch: false, ...o, mound: o.mound ?? 1 })
  const leaves = pixelPaths(cells).map(l => `<path class="grow" d="${l.d}" fill="${l.color}" style="animation-delay:${o.delay + l.delay}ms"/>`).join('')
  const blooms = flowers.map(f => `<g class="bloom" style="animation-delay:${o.delay + f.delay}ms"><path d="M${f.x - 1} ${f.y}h1v1h-1zM${f.x + 1} ${f.y}h1v1h-1zM${f.x} ${f.y - 1}h1v1h-1zM${f.x} ${f.y + 1}h1v1h-1z" fill="#f4f1e4"/><path d="M${f.x} ${f.y}h1v1h-1z" fill="#d4a72c"/></g>`).join('')
  return `<g transform="scale(${o.px})" shape-rendering="crispEdges">${leaves}${blooms}</g>`
}

export async function header(d: ReadmeData, theme: Theme, avatar: string) {
  const c = COLORS[theme]
  const t = new Texts()
  const W = FULL
  const H = 300
  const name = d.profile.name
  // the column next to the avatar spans its frame exactly: the name's capitals start at the frame's
  // top edge, the button's face ends at its bottom edge, the role line sits evenly between them
  const frameTop = 71
  const frameBottom = 221
  const nameX = 240
  const nameY = frameTop + capHeight('pixel', 96)
  const buttonH = 50
  const buttonY = frameBottom - buttonH
  const roleY = Math.round((nameY + buttonY) / 2 + capHeight('mono', 13) / 2)
  const typed = 600 + name.length * 90
  const restX = Math.min(nameX + measure('pixel', name, 96) + 8, W - 70)
  const body = [
    // bushes growing in from two corners, like on the site; the lower one long and low, an L
    `<g transform="translate(9 ${H - 9}) scale(1 -1)">${bush({ seed: 7, width: 40, height: 24, thickness: 8, mound: 0.6, px: 5, delay: 200 })}</g>`,
    `<g transform="translate(${W - 9} 9) scale(-1 1)">${bush({ seed: 3, width: 34, height: 14, thickness: 8, px: 5, delay: 500 })}</g>`,
    // the avatar in a frame
    `<rect x="61.5" y="71.5" width="149" height="149" fill="${c.raised}" stroke="${c.line}" pathLength="1" class="draw" style="animation-delay:200ms"/>`,
    avatarBlocks(avatar, c.raised, 66, 76, 140, 500),
    t.text('pixel', nameX, nameY, name, { size: 96, fill: c.fg, delay: 600, letters: { step: 90 } }),
    t.text('mono', nameX + 3, roleY, `${d.profile.role} · ${d.profile.location}`.toUpperCase(), { size: 13, fill: c.line, spacing: 1.2, delay: typed, letters: { step: 18 } }),
    // the way to the site, right under the name
    button(t, c, { x: nameX + 3, y: buttonY, w: 236, h: buttonH, label: 'integr.cc', size: 34, delay: typed + 500 }),
    // the butterfly flies in and settles at the end of the name
    `<g class="fly" transform="translate(${restX} ${nameY - 96})">${butterfly(c, 3)}</g>`,
  ].join('')
  const css = `${BUTTON_CSS}
.fly{animation:fly 1600ms cubic-bezier(.3,.7,.4,1) ${typed}ms both}
@keyframes fly{from{transform:translate(${W + 40}px,-40px)}60%{transform:translate(${restX + 40}px,${nameY - 150}px)}to{transform:translate(${restX}px,${nameY - 96}px)}}
.wing{transform-box:fill-box;transform-origin:center;animation:flap 160ms steps(2,end) ${typed}ms 10,rest 6s steps(2,end) ${typed + 1600}ms infinite}
@keyframes flap{50%{transform:scaleX(.45)}}
@keyframes rest{0%,94%{transform:none}96%{transform:scaleX(.45)}98%{transform:none}}`
  return sheet({ width: W, height: H, theme, texts: t, body, css, label: 'SHEET 00 · INTEGR.CC', title: `${d.profile.fullName}, ${d.profile.role.toLowerCase()} from ${d.profile.location}. Visit integr.cc` })
}

/** A bold pixel arrow pointing right, 7 x 7, to sit with the pixel font. */
const ARROW = ['...X...', '...XX..', 'XXXXXX.', 'XXXXXXX', 'XXXXXX.', '...XX..', '...X...']
const ARROW_PATH = pixelPaths(ARROW.flatMap((row, y) => [...row].map((ch, x) => ({ x, y, ch })).filter(p => p.ch === 'X')
  .map(p => ({ x: p.x, y: p.y, color: '', delay: 0 }))))[0]!.d

const BUTTON_CSS = `
.press{animation:press 360ms steps(3,end) both}
@keyframes press{from{transform:translate(6px,6px);opacity:0}30%{opacity:1}}
.nudge{animation:nudge 1200ms steps(2,end) 3}
@keyframes nudge{50%{transform:translateX(5px)}}`

/**
 * The site's pixel button: accent face on a hard shadow, dropped into place from the shadow at
 * delay, its label typed in the pixel font and an arrow after it nudging right a few times.
 */
function button(t: Texts, c: Colors, o: { x: number, y: number, w: number, h: number, label: string, size: number, delay: number }) {
  const arrowPx = Math.max(2, Math.round(o.size / 14))
  const lw = measure('pixel', o.label, o.size)
  const gap = arrowPx * 4
  const total = lw + gap + 7 * arrowPx
  const lx = o.x + (o.w - total) / 2
  // the label's lowercase body and the arrow share the button's middle line
  const mid = o.y + o.h / 2
  const base = mid + xHeight('pixel', o.size) / 2
  return [
    `<rect x="${o.x + 6}" y="${o.y + 6}" width="${o.w}" height="${o.h}" fill="${c.line}" class="fade" style="animation-delay:${o.delay}ms"/>`,
    `<g class="press" style="animation-delay:${o.delay}ms">`,
    `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${c.accent}"/>`,
    `<rect x="${o.x + 1}" y="${o.y + 1}" width="${o.w - 2}" height="${o.h - 2}" fill="none" stroke="${c.raised}" stroke-opacity=".35" stroke-width="2"/>`,
    t.text('pixel', lx, base, o.label, { size: o.size, fill: c.bg, delay: o.delay + 300, letters: { step: 55 } }),
    `<g class="nudge" style="animation-delay:${o.delay + 400 + o.label.length * 55}ms"><path d="${ARROW_PATH}" transform="translate(${lx + lw + gap} ${mid - 3.5 * arrowPx}) scale(${arrowPx})" fill="${c.bg}" shape-rendering="crispEdges"/></g>`,
    `</g>`,
  ].join('')
}

/**
 * The avatar drawn in block by block, like PixelAvatar.vue on the site: rows sweep top to bottom,
 * each block landing with a little jitter. The picture is there whole under covers in the frame's
 * colour that drop away block by block (cheaper to draw than blocks of the picture itself); covers
 * that go at about the same moment share one path.
 */
function avatarBlocks(href: string, cover: string, x: number, y: number, size: number, delay: number) {
  const n = 20
  const block = size / n
  const rand = rng(23)
  const groups = new Map<number, string>()
  for (let by = 0; by < n; by++) {
    for (let bx = 0; bx < n; bx++) {
      const at = Math.round(((by / n) * 900 + rand() * 260) / 40) * 40
      groups.set(at, `${groups.get(at) ?? ''}M${x + bx * block} ${y + by * block}h${block}v${block}h-${block}z`)
    }
  }
  return `<image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}"/>`
    + `<g shape-rendering="crispEdges">${[...groups].map(([at, d]) => `<path class="gone" d="${d}" fill="${cover}" style="animation-delay:${delay + at}ms"/>`).join('')}</g>`
}

// ---------- section titles ----------

/** A short title above a section: the word in the pixel font, a rule drawn out after it. */
export async function title(text: string, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const W = FULL
  const H = 60
  const end = measure('pixel', text, 40) + 16
  const body = [
    t.text('pixel', 2, 44, text, { size: 40, fill: c.fg, delay: 100, letters: { step: 60 } }),
    `<path d="M${end} 36.5H${W - 2}" stroke="${c.line}" stroke-opacity=".5" pathLength="1" class="draw" style="animation-delay:${200 + text.length * 60}ms"/>`,
  ].join('')
  return sheet({ width: W, height: H, theme, texts: t, body, bare: true, title: text })
}

// ---------- numbers ----------

export async function stats(d: ReadmeData, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const rows: [string, number][] = [
    ['Contributions, last year', d.totals.contributions],
    ['Commits, last year', d.totals.commits],
    ['Pull requests', d.totals.pullRequests],
    ['Stars earned', d.totals.stars],
    ['Public repositories', d.totals.repos],
  ]
  const top = 52
  const step = 34
  const body = rows.map(([label, n], i) => {
    const y = top + i * step
    const delay = 500 + i * 160
    const value = num(n)
    const right = HALF - 30
    const leaderFrom = 30 + measure('sans', label, 14) + 10
    const leaderTo = right - measure('pixel', value, 30) - 10
    return t.text('sans', 30, y + 14, label, { size: 14, fill: c.muted, cls: 'fade', delay })
      + `<path d="M${leaderFrom} ${y + 10.5}H${leaderTo}" stroke="${c.line}" stroke-opacity=".45" stroke-dasharray="1 4" class="fade" style="animation-delay:${delay + 100}ms"/>`
      + t.text('pixel', right, y + 18, value, { size: 30, fill: c.fg, anchor: 'end', delay: delay + 150, letters: { step: 50 } })
  }).join('')
  return sheet({ width: HALF, height: 240, theme, texts: t, body, label: 'FIG. 1 · BOTH ACCOUNTS', title: rows.map(([l, n]) => `${l}: ${num(n)}`).join(', ') })
}

export async function languages(d: ReadmeData, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const colors = SERIES[theme]
  const x0 = 30
  const width = HALF - 60
  let x = x0
  const bar = d.languages.map((l, i) => {
    const w = Math.max(2, l.share * width)
    const seg = `<rect x="${x}" y="44" width="${w - 2}" height="14" fill="${colors[i % colors.length]}" class="bar" style="animation-delay:${400 + i * 90}ms"/>`
    x += w
    return seg
  }).join('')
  const list = d.languages.map((l, i) => {
    const y = 84 + i * 21
    const delay = 700 + i * 110
    return `<rect x="${x0}" y="${y}" width="9" height="9" fill="${colors[i % colors.length]}" class="fade" style="animation-delay:${delay}ms"/>`
      + t.text('sans', x0 + 18, y + 9, l.name, { size: 14, fill: c.fg, cls: 'fade', delay })
      + t.text('mono', HALF - 30, y + 9, `${(l.share * 100).toFixed(1)}%`, { size: 12, fill: c.muted, anchor: 'end', cls: 'fade', delay: delay + 60 })
  }).join('')
  return sheet({ width: HALF, height: 240, theme, texts: t, body: bar + list, label: 'FIG. 2 · LANGUAGES BY CODE', title: `Languages: ${d.languages.map(l => `${l.name} ${(l.share * 100).toFixed(0)}%`).join(', ')}` })
}

// ---------- activity ----------

/**
 * Plants by how much happened on a day, 5 x 5 pixels, top row first: a sprout, a seedling, a leafy
 * plant, and on the busiest days one in flower. S stem, L leaf, Y young leaf, F petal, C its heart.
 */
const PLANTS = [
  ['.....', '.....', '.....', '..L..', '..S..'],
  ['.....', '.....', '.L.L.', '..S..', '..S..'],
  ['..Y..', '.LYL.', 'L.S.L', '.LS..', '..S..'],
  ['..F..', '.FCF.', '..F..', '.LS..', '..SL.'],
]
const PLANT_COLORS = { S: '#366834', L: '#629134', Y: '#b5b641', C: '#d4a72c' }

/**
 * The year of contributions as a garden: a bed per day, a week per column. Each plant grows up out
 * of its bed row by row, the garden filling in from the left, and the busiest days bloom at the end.
 */
export async function garden(d: ReadmeData, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const W = FULL
  const H = 214
  const PX = 2
  const pitch = 14
  const days = d.days.slice(-371)
  // columns start on Sunday, like GitHub's
  const firstDow = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay()
  const max = Math.max(1, ...days.map(x => x.count))
  const level = (n: number) => (n === 0 ? -1 : Math.min(3, Math.floor((n / max) ** 0.6 * 4)))
  const weeks = Math.ceil((days.length + firstDow) / 7)
  const x0 = Math.round((W - weeks * pitch) / 2) + 14
  const y0 = 50
  const petal = theme === 'light' ? '#fffdf4' : '#f4f1e4'

  const beds: string[] = []
  // one path per colour and moment
  const groups = new Map<string, { color: string, delay: number, d: string, bloom: boolean }>()
  // a flower opens from its own centre, so it is a group of its own
  const add = (color: string, delay: number, d: string, bloom?: string) => {
    const key = `${color} ${delay} ${bloom ?? ''}`
    const g = groups.get(key) ?? { color, delay, d: '', bloom: !!bloom }
    g.d += d
    groups.set(key, g)
  }
  let lastBloom = 0
  days.forEach((day, i) => {
    const k = i + firstDow
    const col = Math.floor(k / 7)
    const cx = x0 + col * pitch
    const cy = y0 + (k % 7) * pitch
    // the bed: a short strip of soil under every day
    beds.push(`M${cx} ${cy + 10}h10v2h-10z`)
    const lv = level(day.count)
    if (lv < 0) return
    const start = 400 + col * 20
    PLANTS[lv]!.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return
      const square = `M${cx + rx * PX} ${cy + ry * PX}h${PX}v${PX}h-${PX}z`
      if (ch === 'F' || ch === 'C') {
        // flowers open once the whole garden has grown
        const at = 400 + weeks * 20 + 200 + (col % 6) * 70
        lastBloom = Math.max(lastBloom, at)
        add(ch === 'F' ? petal : PLANT_COLORS.C, at, square, `${cx},${cy}`)
      }
      else {
        add(PLANT_COLORS[ch as 'S' | 'L' | 'Y'], start + (4 - ry) * 60, square)
      }
    }))
  })
  const grown = [...groups.values()].map(g =>
    `<path class="${g.bloom ? 'bloom' : 'grow'}" d="${g.d}" fill="${g.color}" style="animation-delay:${g.delay}ms"/>`).join('')
  const done = lastBloom + 400

  // month names above the first column of each month
  let lastMonth = -1
  const months = days.map((day, i) => {
    const m = Number(day.date.slice(5, 7)) - 1
    const col = Math.floor((i + firstDow) / 7)
    if (m === lastMonth || (i + firstDow) % 7 !== 0) return ''
    lastMonth = m
    return t.text('mono', x0 + col * pitch, y0 - 10, MONTHS[m]!, { size: 10, fill: c.muted, cls: 'fade', delay: 300 + col * 20 })
  }).join('')
  const dow = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].map(([r, s]) =>
    t.text('mono', x0 - 8, y0 + (r as number) * pitch + 10, s as string, { size: 10, fill: c.muted, anchor: 'end', cls: 'fade', delay: 300 })).join('')

  // longest run of days with something done
  let streak = 0
  let run = 0
  for (const x of days) {
    run = x.count ? run + 1 : 0
    streak = Math.max(streak, run)
  }
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a))
  const summary = `${num(d.totals.contributions)} contributions in the last year  ·  longest streak ${streak} days  ·  busiest day ${day(busiest.date)}`

  // the legend: the four plants in a row, drawn straight away
  const lx = W - 130
  const ly = H - 44
  const legend = PLANTS.map((plant, n) => plant.map((row, ry) => [...row].map((ch, rx) => {
    if (ch === '.') return ''
    const color = ch === 'F' ? petal : PLANT_COLORS[ch as 'S' | 'L' | 'Y' | 'C']
    return `<rect x="${lx + n * pitch + rx * PX}" y="${ly + ry * PX}" width="${PX}" height="${PX}" fill="${color}"/>`
  }).join('')).join('') + `<rect x="${lx + n * pitch}" y="${ly + 10}" width="10" height="2" fill="${c.soil}"/>`).join('')

  const body = [
    `<path d="${beds.join('')}" fill="${c.soil}" class="fade" style="animation-delay:200ms"/>`,
    `<g shape-rendering="crispEdges">${grown}</g>`,
    months,
    dow,
    t.text('mono', 30, H - 30, summary, { size: 12, fill: c.fg, cls: 'fade', delay: done }),
    t.text('mono', lx - 8, H - 33, 'less', { size: 10, fill: c.muted, anchor: 'end', cls: 'fade', delay: done }),
    `<g class="fade" style="animation-delay:${done}ms" shape-rendering="crispEdges">${legend}</g>`,
    t.text('mono', lx + 4 * pitch, H - 33, 'more', { size: 10, fill: c.muted, cls: 'fade', delay: done }),
  ].join('')
  return sheet({ width: W, height: H, theme, texts: t, body, label: 'FIG. 3 · A YEAR OF WORK', title: summary })
}

// ---------- lately ----------

export async function recent(d: ReadmeData, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const body = d.recent.map((r, i) => {
    const y = 48 + i * 44
    const delay = 400 + i * 220
    const [owner, repo] = r.repo.split('/')
    return t.text('mono', 30, y + 12, `${owner}/`, { size: 12, fill: c.muted, delay, letters: { step: 12 } })
      + t.text('mono', 30 + measure('mono', `${owner}/`, 12), y + 12, repo!, { size: 12, fill: c.fg, weight: 700, delay: delay + (owner!.length + 1) * 12, letters: { step: 12 } })
      + t.text('mono', HALF - 30, y + 12, day(r.at).replace(/ \d{4}$/, ''), { size: 11, fill: c.muted, anchor: 'end', cls: 'fade', delay })
      + t.text('sans', 30, y + 31, r.what, { size: 14, fill: c.line, cls: 'fade', delay: delay + 120 })
  }).join('')
  const empty = d.recent.length ? '' : t.text('sans', 30, 70, 'Nothing public lately.', { size: 14, fill: c.muted, cls: 'fade', delay: 400 })
  return sheet({ width: HALF, height: 240, theme, texts: t, body: body + empty, label: 'FIG. 4 · RECENT ACTIVITY', title: `Recent activity: ${d.recent.map(r => `${r.repo} ${r.what}`).join('; ')}` })
}

export async function post(d: ReadmeData, theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const p = d.post
  if (!p) return sheet({ width: HALF, height: 240, theme, texts: t, body: t.text('sans', 30, 70, 'No posts yet.', { size: 14, fill: c.muted }), label: 'FIG. 5 · LATEST POST', title: 'No posts yet' })
  const titleLines = wrap('sans', p.title, 19, HALF - 60, 2, 700)
  const summary = wrap('sans', p.summary, 13.5, HALF - 60, 3)
  const ty = 76
  const sy = ty + titleLines.length * 25 + 8
  const body = [
    t.text('mono', 30, 50, day(p.date).toUpperCase(), { size: 11, fill: c.line, spacing: 1, cls: 'fade', delay: 400 }),
    ...titleLines.map((l, i) => t.text('sans', 30, ty + i * 25, l, { size: 19, weight: 700, fill: c.fg, delay: 500 + i * 300, letters: { step: 14 } })),
    ...summary.map((l, i) => t.text('sans', 30, sy + i * 20, l, { size: 13.5, fill: c.muted, cls: 'fade', delay: 1100 + i * 120 })),
    t.text('mono', 30, 214, 'read it on integr.cc →', { size: 12, fill: c.accent, cls: 'fade', delay: 1500 }),
  ].join('')
  return sheet({ width: HALF, height: 240, theme, texts: t, body, label: 'FIG. 5 · LATEST POST', title: `Latest post: ${p.title}. ${p.summary}` })
}

// ---------- the way out ----------

/**
 * The way to the site: a pixel button standing between two patches of the bushes, pressed down
 * into its shadow as it is drawn, its arrow nudging right; the butterfly rests on its corner.
 */
export async function cta(theme: Theme) {
  const c = COLORS[theme]
  const t = new Texts()
  const W = FULL
  const H = 190
  const bw = 400
  const bh = 72
  const bx = (W - bw) / 2
  const by = 48
  const patch = (seed: number, width: number, height: number, delay: number) => {
    const { cells, flowers } = growBush({ patch: true, seed, width, height, thickness: 0, mound: 1 })
    const leaves = pixelPaths(cells).map(l => `<path class="grow" d="${l.d}" fill="${l.color}" style="animation-delay:${delay + l.delay}ms"/>`).join('')
    const blooms = flowers.map(f => `<g class="bloom" style="animation-delay:${delay + f.delay}ms"><path d="M${f.x - 1} ${f.y}h1v1h-1zM${f.x + 1} ${f.y}h1v1h-1zM${f.x} ${f.y - 1}h1v1h-1zM${f.x} ${f.y + 1}h1v1h-1z" fill="#f4f1e4"/><path d="M${f.x} ${f.y}h1v1h-1z" fill="#d4a72c"/></g>`).join('')
    return `<g transform="scale(6)" shape-rendering="crispEdges">${leaves}${blooms}</g>`
  }
  const body = [
    // patches of the bushes on the ground line, either side of the button
    `<g transform="translate(70 ${H - 9}) scale(1 -1)">${patch(5, 20, 9, 200)}</g>`,
    `<g transform="translate(${W - 190} ${H - 9}) scale(1 -1)">${patch(9, 18, 8, 450)}</g>`,
    button(t, c, { x: bx, y: by, w: bw, h: bh, label: 'visit integr.cc', size: 44, delay: 300 }),
    t.text('mono', W / 2, by + bh + 34, 'PROJECTS · POSTS · TIMELINE · CONTACT', { size: 11, fill: c.muted, anchor: 'middle', spacing: 1.4, cls: 'fade', delay: 1500 }),
    // the butterfly settled on the button's corner
    `<g class="fade" style="animation-delay:1800ms"><g transform="translate(${bx + bw - 34} ${by - 22})">${butterfly(c, 3)}</g></g>`,
  ].join('')
  const css = `${BUTTON_CSS}
.wing{transform-box:fill-box;transform-origin:center;animation:rest 5s steps(2,end) 2200ms infinite}
@keyframes rest{0%,92%{transform:none}95%{transform:scaleX(.45)}98%{transform:none}}`
  return sheet({ width: W, height: H, theme, texts: t, body, css, title: 'Visit integr.cc: projects, posts, timeline and contact' })
}
