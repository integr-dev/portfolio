/**
 * The pixel bush generator behind PixelBush.vue, also used by the GitHub readme images
 * (modules/readme). Generated from a seed, so every run draws the same bush.
 */

// the avatar's bush, dark to light
export const BUSH_PALETTE = ['#2c5a2c', '#366834', '#629134', '#6ca049', '#b5b641', '#d4d25a']
/** ms from the first to the last leaf */
export const BUSH_GROW = 1400

export interface BushCell { x: number, y: number, color: string, delay: number }
export interface BushFlower { x: number, y: number, delay: number }

export interface BushOptions {
  /** a small patch standing on an edge instead of an L around a corner */
  patch: boolean
  seed: number
  /** size in bush pixels: the arm along the horizontal edge, the arm along the vertical edge */
  width: number
  height: number
  /** how far the bush reaches in from the edges, at the corner */
  thickness: number
  /** size of the round mound at the corner, relative to the thickness: lower is more L-shaped */
  mound: number
}

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The bush's leaves and flowers; 0, 0 is the corner (a patch: the left end of its base). */
export function growBush(o: BushOptions): { cells: BushCell[], flowers: BushFlower[] } {
  const { width: W, height: H, patch } = o
  const rand = rng(o.seed)
  const flowerCount = patch ? (W >= 10 ? 2 : 1) : Math.round((W + H) / 8)

  let clumps: { x: number, y: number, r: number }[]
  if (patch) {
    // a few clumps side by side on the base line, the middle one tallest
    const n = 3
    clumps = Array.from({ length: n }, (_, i) => {
      const f = i / (n - 1) - 0.5
      return { x: W / 2 + f * W * 0.5 + (rand() - 0.5) * 1.5, y: 0, r: H * (1 - Math.abs(f) * 0.6) * (0.85 + rand() * 0.15) }
    })
  }
  else {
    // leaf clumps along both edges, an L around the corner: thickest at the corner and thinner
    // further out, so the bush hugs the edges and stays out of the content
    const T = o.thickness
    clumps = []
    const arm = (length: number, along: 'x' | 'y') => {
      const n = Math.max(2, Math.round(length / 3))
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1)
        const r = T * (0.4 + rand() * 0.2) * (1 - 0.6 * f)
        const a = f * length * 0.92 + (rand() - 0.5) * 2
        const b = r * 0.5 + rand() * 1.5
        clumps.push(along === 'x' ? { x: a, y: b, r } : { x: b, y: a, r })
      }
    }
    arm(W, 'x')
    arm(H, 'y')
    // a round mound at the corner that the two arms grow out of
    const M = o.mound
    clumps.push({ x: 3, y: 3, r: T * 1.05 * M }, { x: T * 0.9, y: T * 0.45, r: T * 0.8 * M }, { x: T * 0.45, y: T * 0.9, r: T * 0.8 * M })
  }

  const cells: BushCell[] = []
  const filled = new Set<string>()
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let best: { dx: number, dy: number, d: number } | null = null
      for (const c of clumps) {
        const dx = x + 0.5 - c.x
        const dy = y + 0.5 - c.y
        const d = Math.hypot(dx, dy) / c.r
        if (!best || d < best.d) best = { dx: dx / c.r, dy: dy / c.r, d }
      }
      // a ragged edge, like leaves
      if (!best || best.d > 1 - rand() * 0.28) continue
      filled.add(`${x},${y}`)
      // light from above: the far side of each clump is lighter, the side toward the corner darker
      const shade = 0.5 + best.dy * 0.35 - best.dx * 0.12 - best.d * 0.25 + (rand() - 0.5) * 0.45
      const idx = Math.max(0, Math.min(BUSH_PALETTE.length - 1, Math.floor(shade * BUSH_PALETTE.length)))
      // grows out from the corner along both arms; a patch from the middle of its base
      const dist = patch ? Math.min(1, Math.hypot((x - W / 2) / (W / 2), y / H)) : Math.min(1, Math.max(x / W, y / H))
      cells.push({ x, y, color: BUSH_PALETTE[idx]!, delay: Math.round(dist * BUSH_GROW + rand() * 180) })
    }
  }

  // flowers on the inner edge of either arm, away from the corner, opening once the bush is grown;
  // on a patch, along its top
  const edge = patch
    ? cells.filter(c => c.y > 0 && !filled.has(`${c.x},${c.y + 1}`))
    : cells.filter(c => Math.max(c.x / W, c.y / H) > 0.15
      && (c.x > c.y ? !filled.has(`${c.x},${c.y + 1}`) : !filled.has(`${c.x + 1},${c.y}`)))
  const flowers: BushFlower[] = []
  for (let i = 0; i < flowerCount && edge.length; i++) {
    const c = edge.splice(Math.floor(rand() * edge.length), 1)[0]!
    if (flowers.some(f => Math.abs(f.x - c.x) < 4 && Math.abs(f.y - c.y) < 3)) continue
    flowers.push({ x: c.x, y: c.y, delay: (patch ? BUSH_GROW / 2 : BUSH_GROW) + 200 + i * 160 + Math.round(rand() * 120) })
  }
  return { cells, flowers }
}
