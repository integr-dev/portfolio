import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { cta, garden, header, languages, post, recent, stats, title } from './cards'
import { collect } from './data'
import { loadMetrics } from './svg'
import type { Theme } from './svg'

/**
 * The images of my GitHub profile readmes (readme/*.md, one per account), drawn like the site and
 * served from it at /readme/<name>-<light|dark>.svg. The build fetches the numbers from GitHub
 * (summed over both accounts) and the newest post from content/; the daily rebuild keeps them
 * current (server/plugins/daily-rebuild.ts). Without a GITHUB_TOKEN (dev) the numbers are made up.
 */

/** The section titles, short: the readme's headings, as images. */
export const TITLES = ['numbers', 'activity', 'lately', 'more'] as const

export default defineNuxtModule({
  meta: { name: 'readme' },
  async setup(_, nuxt) {
    if (nuxt.options._prepare) return
    // not in the build dir: Nuxt empties that after the modules have run
    const out = join(nuxt.options.rootDir, 'node_modules/.cache/readme-images')
    nuxt.options.nitro.publicAssets ||= []
    nuxt.options.nitro.publicAssets.push({ dir: out, baseURL: '/readme', maxAge: 3600 })

    // drawn before Nitro starts, so the files are there when it copies the public assets
    await generate(nuxt.options.rootDir, out).catch((e) => {
      console.warn(`[readme] images not drawn: ${(e as Error).message}`)
    })
  },
})

async function generate(rootDir: string, out: string) {
  const [data] = await Promise.all([collect(rootDir), loadMetrics()])
  const avatar = `data:image/webp;base64,${(await readFile(join(rootDir, 'public/img/avatar.webp'))).toString('base64')}`
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  const images: Record<string, (theme: Theme) => Promise<string>> = {
    header: th => header(data, th, avatar),
    stats: th => stats(data, th),
    languages: th => languages(data, th),
    garden: th => garden(data, th),
    recent: th => recent(data, th),
    post: th => post(data, th),
    cta: th => cta(th),
    ...Object.fromEntries(TITLES.map(t => [`title-${t}`, (th: Theme) => title(t, th)])),
  }
  await Promise.all(Object.entries(images).flatMap(([name, draw]) => (['light', 'dark'] as const).map(async (th) => {
    await writeFile(join(out, `${name}-${th}.svg`), await draw(th))
  })))
  console.info(`[readme] drew ${Object.keys(images).length * 2} images${data.sample ? ' (made-up numbers)' : ''}`)
}
