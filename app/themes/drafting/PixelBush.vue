<script setup lang="ts">
import { growBush } from './bush'

// A pixel-art bush like the one in the avatar, growing out of a corner of the page, with small
// white flowers opening on it once it has grown. Generated from a seed, so the server and the
// browser draw the same bush. Purely decorative. Placed on an edge instead of a corner, it is a
// small patch: a low mound standing on that edge, growing out from the middle of its base.
const props = withDefaults(defineProps<{
  corner: 'bottom-left' | 'top-right' | 'top-left' | 'bottom' | 'top' | 'left' | 'right'
  /** patches only: where along the edge, from the left (top, bottom) or the top (left, right) */
  at?: string
  seed?: number
  /** ms before it starts growing, on the old page clock: 900 is the moment the first sheet starts
   *  to be drawn (html.is-drawing), which is when the bushes' clock now starts */
  delay?: number
  /** size in bush pixels: the arm along the horizontal edge, the arm along the vertical edge */
  width?: number
  height?: number
  /** how far the bush reaches in from the edges, at the corner */
  thickness?: number
  /** size of the round mound at the corner, relative to the thickness: lower is more L-shaped */
  mound?: number
}>(), { seed: 7, delay: 900, width: 48, height: 26, thickness: 14, mound: 1 })

const PX = 8 // one pixel of the bush, in CSS px (half a grid square)
const W = props.width
const H = props.height

const bush = computed(() => growBush({
  patch: !props.corner.includes('-'),
  seed: props.seed,
  width: W,
  height: H,
  thickness: props.thickness,
  mound: props.mound,
}))

const leaves = computed(() => pixelPaths(bush.value.cells))
</script>

<template>
  <svg
    class="bush"
    :class="`bush-${corner}`"
    :viewBox="`0 0 ${W} ${H}`"
    :width="W * PX"
    :height="H * PX"
    :style="{ '--delay': `${delay - 900}ms`, '--at': at }"
    aria-hidden="true"
    shape-rendering="crispEdges"
  >
    <!-- y is flipped so the bush stands on the bottom edge; the top-right one is turned round by CSS -->
    <g :transform="`translate(0 ${H}) scale(1 -1)`">
      <path
        v-for="(l, i) in leaves"
        :key="i"
        class="leaf"
        :d="l.d"
        :fill="l.color"
        :style="{ animationDelay: `calc(var(--delay) + ${l.delay}ms)` }"
      />
      <g
        v-for="(f, i) in bush.flowers"
        :key="`f${i}`"
        class="flower"
        :style="{ animationDelay: `calc(var(--delay) + ${f.delay}ms)`, transformOrigin: `${f.x + 0.5}px ${f.y + 0.5}px` }"
      >
        <rect :x="f.x - 1" :y="f.y" width="1" height="1" class="petal" />
        <rect :x="f.x + 1" :y="f.y" width="1" height="1" class="petal" />
        <rect :x="f.x" :y="f.y - 1" width="1" height="1" class="petal" />
        <rect :x="f.x" :y="f.y + 1" width="1" height="1" class="petal" />
        <rect :x="f.x" :y="f.y" width="1" height="1" class="heart" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.bush {
  position: fixed;
  /* over the frame line, under the sheets (which come later in the page) */
  z-index: 1;
  pointer-events: none;
  overflow: visible;
}

.bush-bottom-left {
  left: 0;
  bottom: 0;
}

/* the same kind of bush hanging from the top right corner */
.bush-top-right {
  right: 0;
  top: 0;
  transform: scale(-1, -1);
}

/* a smaller one hanging from the top left corner */
.bush-top-left {
  left: 0;
  top: 0;
  transform: scaleY(-1);
}

/* patches: standing on an edge, the base on the edge and the leaves pointing into the page */
.bush-bottom {
  bottom: 0;
  left: var(--at);
}

.bush-top {
  top: 0;
  left: var(--at);
  transform: scaleY(-1);
}

.bush-left {
  left: 0;
  top: var(--at);
  transform-origin: top left;
  transform: rotate(90deg) translateY(-100%);
}

.bush-right {
  right: 0;
  top: var(--at);
  transform-origin: top right;
  transform: rotate(-90deg) translateY(-100%);
}

/* leaves appear one by one, outward from the corner, once the first sheet starts to be drawn */
html.is-drawing .leaf {
  animation: leaf 220ms steps(2, end) both;
}

/* before that: nothing yet (only where it will be animated in) */
@media (prefers-reduced-motion: no-preference) {
  html.js:not(.is-drawing) .leaf {
    opacity: 0;
  }

  html.js:not(.is-drawing) .flower {
    transform: scale(0);
  }
}

@keyframes leaf {
  from { opacity: 0; }
}

.petal {
  fill: #f4f1e4;
}

.heart {
  fill: var(--accent);
}

/* flowers open from their centre */
html.is-drawing .flower {
  animation: bloom 360ms steps(3, end) both;
}

@keyframes bloom {
  from { transform: scale(0); }
}

/* none on phones: the screen is for the content */
@media (max-width: 767px) {
  .bush {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.is-drawing .leaf,
  html.is-drawing .flower {
    animation: none;
  }
}
</style>
