<script setup lang="ts">
// Clay 5: Markdown in docs/ and a hand written clay.yaml go into clay build, the command of the
// clay-doc npm package, which checks the docs and pre-renders every page with Clay's Nuxt app
// into a static site. Facts from the repository README.

const { t, te } = useI18n()
const d = (key: string) => t(`diagram.clay.${key}`)
// cells hold file names (kept as they are) or words (translated by key)
const cell = (key: string) => (te(`diagram.clay.${key}`) ? d(key) : key)

const docs = [
  { t: 'index.md', x: 22, w: 112 },
  { t: 'index.de.md', x: 140, w: 112 },
  { t: 'guides/setup.md', x: 22, w: 230, row: 1 },
]
const config = [
  { t: 'title', x: 306, w: 112 },
  { t: 'theme', x: 424, w: 112 },
  { t: 'languages', x: 306, w: 112, row: 1 },
  { t: 'openapi', x: 424, w: 112, row: 1 },
]
const build = [
  { t: 'checks', x: 22, w: 112 },
  { t: 'prerender', x: 140, w: 136, accent: true },
  { t: 'search', x: 282, w: 112 },
]
const site = [
  { t: 'pages', x: 22, w: 124 },
  { t: 'sitemap.xml', x: 152, w: 112 },
  { t: 'llms.txt', x: 270, w: 136, accent: true },
  { t: 'images', x: 412, w: 124 },
]
</script>

<template>
  <figure class="diagram">
    <svg viewBox="0 0 560 460" role="img" :aria-label="d('aria')">
      <!-- inputs -->
      <rect class="box" x="8" y="8" width="260" height="112" pathLength="1" data-build="path" data-pen />
      <text class="label" x="22" y="32" data-build="fade">docs/</text>
      <text class="note" x="254" y="32" text-anchor="end" data-build="fade">Markdown</text>
      <g data-build="fade">
        <g v-for="c in docs" :key="c.t">
          <rect class="cell" :x="c.x" :y="46 + (c.row ?? 0) * 34" :width="c.w" height="26" />
          <text class="cell-text" :x="c.x + c.w / 2" :y="63 + (c.row ?? 0) * 34" text-anchor="middle">{{ cell(c.t) }}</text>
        </g>
      </g>

      <rect class="box" x="292" y="8" width="260" height="112" pathLength="1" data-build="path" data-pen />
      <text class="label" x="306" y="32" data-build="fade">clay.yaml</text>
      <text class="note" x="538" y="32" text-anchor="end" data-build="fade">{{ d('byHand') }}</text>
      <g data-build="fade">
        <g v-for="c in config" :key="c.t">
          <rect class="cell" :x="c.x" :y="46 + (c.row ?? 0) * 34" :width="c.w" height="26" />
          <text class="cell-text" :x="c.x + c.w / 2" :y="63 + (c.row ?? 0) * 34" text-anchor="middle">{{ cell(c.t) }}</text>
        </g>
      </g>

      <!-- inputs → build -->
      <path class="wire" d="M138,120 V180" pathLength="1" data-build="path" />
      <path class="head" d="M133,174 L138,180 L143,174" pathLength="1" data-build="path" />
      <path class="flow down" d="M138,120 V180" data-build="fade" />
      <path class="wire" d="M346,120 V180" pathLength="1" data-build="path" />
      <path class="head" d="M341,174 L346,180 L351,174" pathLength="1" data-build="path" />
      <path class="flow down" d="M346,120 V180" data-build="fade" />

      <!-- build -->
      <rect class="box strong" x="8" y="180" width="400" height="100" pathLength="1" data-build="path" data-pen />
      <text class="label" x="22" y="204" data-build="fade">clay build</text>
      <text class="note" x="394" y="204" text-anchor="end" data-build="fade">npm · clay-doc</text>
      <text class="note" x="22" y="224" data-build="fade">{{ d('buildNote') }}</text>
      <g data-build="fade">
        <g v-for="c in build" :key="c.t">
          <rect class="cell" :class="{ accent: c.accent }" :x="c.x" y="238" :width="c.w" height="26" />
          <text class="cell-text" :x="c.x + c.w / 2" y="255" text-anchor="middle">{{ cell(c.t) }}</text>
        </g>
      </g>

      <!-- Clay's Nuxt app, inside the package, renders the pages -->
      <path class="wire dashed" d="M428,230 H408" pathLength="1" data-build="path" />
      <rect class="box" x="428" y="180" width="124" height="100" pathLength="1" data-build="path" data-pen />
      <g data-build="fade">
        <text class="label" x="440" y="204">Clay</text>
        <text class="note" x="440" y="224">{{ d('app') }}</text>
        <text class="note" x="440" y="242">Nuxt · Vue</text>
        <text class="note" x="440" y="260">marked · Shiki</text>
      </g>

      <!-- build → site -->
      <path class="wire" d="M208,280 V340" pathLength="1" data-build="path" />
      <path class="head" d="M203,334 L208,340 L213,334" pathLength="1" data-build="path" />
      <path class="flow down" d="M208,280 V340" data-build="fade" />
      <text class="note" x="218" y="314" data-build="fade">{{ d('folder') }}</text>

      <!-- site -->
      <rect class="box strong" x="8" y="340" width="544" height="112" pathLength="1" data-build="path" data-pen />
      <text class="label" x="22" y="364" data-build="fade">{{ d('site') }}</text>
      <text class="note" x="538" y="364" text-anchor="end" data-build="fade">{{ d('anyHost') }}</text>
      <text class="note" x="22" y="384" data-build="fade">{{ d('siteNote') }}</text>
      <g data-build="fade">
        <g v-for="c in site" :key="c.t">
          <rect class="cell" :class="{ accent: c.accent }" :x="c.x" y="400" :width="c.w" height="26" />
          <text class="cell-text" :x="c.x + c.w / 2" y="417" text-anchor="middle">{{ cell(c.t) }}</text>
        </g>
      </g>
    </svg>
  </figure>
</template>

<style scoped src="./diagram.css"></style>
