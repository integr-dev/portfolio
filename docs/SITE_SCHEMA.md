# integr.cc — Site Schema

This spec describes the layout, content model and navigation of the site. The visual "decoration" (the drafting theme) is kept separate, so it can be replaced without touching the layout or the content.

---

## 1. Layers

| Layer | What it is | Where it lives | Swappable? |
|---|---|---|---|
| **Content** | Profile, projects, posts, timeline, skills, contact | `content/` (Markdown + YAML) | Edit freely |
| **Structure** | Deck engine: sheets, horizontal/vertical navigation, search, routing | `app/deck/` | Stable |
| **Decoration** | Colors, fonts, sheet frame, background, transitions, ornaments | `app/themes/<name>/` | Swap by changing one config value |

Rules:
- Structure components never hardcode a color, font, border or ornament. They only use theme tokens (CSS variables) and theme slot components.
- Content never contains layout or styling. Markdown and frontmatter hold data only.
- Decoration never decides order, navigation or which data is shown.

---

## 2. Stack

- **Nuxt 4 + Vue 3 + TypeScript**
- **@nuxt/content** holds projects, posts, timeline, skills and profile as files
- A Cloudflare Worker (`cloudflare_module` preset) on `integr.cc`, deployed by Cloudflare Workers Builds on every push to master (`npm run build`, then `npx wrangler deploy`). Every page is prerendered and served as a static file, and unknown paths get the prerendered `404.html` (`not_found_handling`), all without starting the Worker. The Worker only runs for Nuxt Studio (`/admin`, `/__nuxt_studio/*`, `/sw.js`) and Nuxt Content's queries (`/__nuxt_content/*`), listed in `run_worker_first`. Nuxt Content reads from the D1 database bound as `DB` there. The Worker's variables and secrets (Studio's `STUDIO_GITHUB_*` login settings, `NUXT_STUDIO_AUTH_SESSION_SECRET`) are set in the Cloudflare dashboard and copied into `process.env` on each request (`server/plugins/cloudflare-env.ts`); `keep_vars` keeps them when a build deploys. The Worker answers only on `integr.cc` (no `workers.dev` address). Cache lifetimes: hashed files (`/_nuxt`, `/_fonts`, `/_i18n`) a year, `immutable`; `/img`, the preview images a day, then served stale while refreshed for up to a week; favicons and the logo a week; pages always checked (`routeRules` in nuxt.config, written into `_headers`). A changed image gets a new file name. Short links (`/gh`, `/modrinth`, `/rss`, `/osmium`, `/helix`, `/backbone`, `/clay`, `/forkcast`) are 302 redirects in `public/_redirects`, answered by the static layer.

---

## 3. Navigation model (reveal.js-style)

The site is a 2D grid of sheets:

```
 x →   00      01      02      03      04      05      06        07      08      09      10
      Intro  Osmium   Clay  Forkcast Backbone Helix  Projects  Posts  Timeline Skills Contact
 y                                                    │         │
 ↓                                                  More      feed
                                                  (hidden     (free
                                                  until       vertical
                                                  clicked)    scroll)
```

- **Horizontal (x) is the main axis.** Each sheet is one horizontal step.
- **Vertical (y) exists only inside one sheet** that forms a logical group. A sheet has one of three modes:

| Mode | Behaviour | Used by |
|---|---|---|
| `single` | One full-screen slide. A vertical input goes to the next or previous sheet. | Intro, flagships, Timeline, Skills, Contact |
| `stack` | Several slides stacked vertically, snapped like reveal.js vertical slides. | Projects (main + More) |
| `feed` | One free-scrolling vertical column. Leaving it horizontally goes to the neighbouring sheet. | Posts |

### Input mapping

| Input | `single` | `stack` | `feed` |
|---|---|---|---|
| ← / → , Page keys | prev/next sheet | prev/next sheet | prev/next sheet |
| ↑ / ↓ | prev/next sheet | prev/next slide in the stack | scroll the column |
| Mouse wheel / trackpad | moves along x | moves along y inside the stack, then x at the ends | scrolls the column, then x at the ends |
| Touch swipe | x | x or y by swipe direction | native scroll on y, swipe on x |
| `/` · `⌘K` · `⌥Space` | open search | open search | open search |
| `Home` / `End` | first / last sheet | first / last sheet | top / bottom of the feed |

### URL / deep links
- Opening the site on a deep link jumps straight to that sheet with no slide from the intro; only later moves animate.

- Every position is a real path (`app/deck/paths.ts`): `/` (intro), `/projects/<flagship>` and `/projects/<flagship>/readme`, `/projects` and `/projects/more`, `/posts` and `/posts/<slug>`, `/timeline`, `/skills`, `/contact`. A sheet's path defaults to `/<id>`; flagships set `path` in `sheets.config.ts`.
- One page, `app/pages/[...slug].vue`, serves them all with a fixed page key, so moving changes the path without reloading or remounting; the server renders the right position directly. Unknown paths throw the 404.
- Old hash links (`/#/helix/readme`) are redirected to their path on load.
- Browser back/forward walks the history of visited sheets.

### Small screens (< 768px)

- The deck turns into one vertical scroll: sheets stack top to bottom and `stack` slides are shown inline.
- Sheet order stays the same, but phones get only the essentials (CSS, each component's `max-width: 767px` block):
  - left out: readme pages and the More page (a deep link to one lands on its sheet), the flagship body text and visuals, the project list body text, post tags and the RSS link, timeline details, the intro's image caption and keyboard hints
  - kept: name, pitch, what I'm looking for, shortcuts, flagship title, tagline, why, stats, stack and links, the post list and posts, skills, contact

### Reduced motion

- `prefers-reduced-motion` → no slide transitions, instant jumps, no ornament animation.

---

## 4. Sheet registry

Sheet order is defined in `app/deck/sheets.config.ts`, so reordering is a one-line change. `component` names map to Vue components in `app/sheets/index.ts`; `props` are passed through.

```ts
export const sheets: SheetDef[] = [
  { id: 'intro', title: 'Intro', mode: 'single', component: 'IntroSheet' },
  { id: 'osmium', title: 'Osmium', mode: 'single', component: 'FlagshipSheet', props: { project: 'osmium', visual: 'left' } },
  // clay, forkcast, backbone, helix: same shape
  {
    id: 'projects', title: 'Projects', mode: 'stack',
    slides: [
      { id: 'main', component: 'ProjectListSlide', props: { tier: 'featured' } },
      { id: 'more', component: 'ProjectListSlide', props: { tier: 'more' } },
    ],
  },
  { id: 'posts', title: 'Posts', mode: 'feed', component: 'PostFeedSheet' },
  { id: 'timeline', title: 'Timeline', mode: 'single', component: 'TimelineSheet' },
  { id: 'skills', title: 'Skills', mode: 'single', component: 'SkillsSheet' },
  { id: 'contact', title: 'Contact', mode: 'single', component: 'ContactSheet' },
]
```

Types live in `app/deck/types.ts` (`SheetDef`, `SlideDef`, `SearchEntry`).

To add a flagship: add `content/en/projects/<slug>.md` with `tier: flagship`, then one line in `sheets.config.ts`.

---

## 5. Sheets: content

### 00 · Intro
- Big name types itself, then keeps deleting and retyping "integr" ↔ "erik" (a `data-build="custom"` part, so the builder starts it)
- Drawn shortcut buttons: Projects, Posts, Contact
- Live age (computed from the birth year and month, which are not shown), "Austria"
- One-line pitch (Kotlin-first developer, open source)
- Under the facts, a quiet sentence: "Last worked on <repo>, <when>." (the repo name links to it). It is my newest public push across `integr-dev` and `e-reitbauer` (the site's own repo left out), read from GitHub by the build (`#build/build-info.mjs`, `modules/live-stats.ts`; also in dev). The page carries the push's date; the browser turns it into "2 days ago" / "vor 2 Tagen". No push found: no line.
- Hint: "press / to search" and "→ to continue"
- **No school name.**

### 01–05 · Flagships (`FlagshipSheet`, one per project)
Order: **Osmium, Clay, Forkcast, Backbone, Helix.**

Every flagship sheet has the same layout: title and text stay together in one column, and the visual takes the other column. `visual: 'left' | 'right'` in `sheets.config.ts` picks the side (Osmium, Clay and Helix left; Forkcast and Backbone right). Slots:

| Slot | Content |
|---|---|
| `title` + `tagline` | Name and a one-line description |
| `why` | **"Why this one"** callout: 1–2 sentences on why it's featured |
| `stats` | Stat plate (key → value), e.g. commits, downloads, stars |
| `badge` | Optional headline number (Helix: **1,400+ downloads on Modrinth**) |
| `stack` | Technology chips |
| `visuals` | One or more of: screenshots, diagram, code, chart. Several form a carousel |
| `links` | Repo, live site, Modrinth, … |

Draft "why" lines (to edit):
- **Osmium:** "My largest system so far: a web dashboard that coordinates a fleet of headless agents working one large job together, with realtime telemetry, live 3D views and a custom host protocol."
- **Clay:** "A complete toolchain I designed and maintain under its own org: a Vue/Nuxt docs frontend plus a Go CLI that turns Markdown into a deployable site."
- **Forkcast:** "A team product with real UX depth: drag-and-drop planning, automatic shopping lists, and 9 languages including right-to-left."
- **Backbone:** "Server logic you can change while the server runs: hot-reloadable Kotlin scripts with their own event bus, commands, GUIs and storage."
- **Helix:** "Shipped to real users: 1,400+ downloads on Modrinth."

### Flagship README pages
Every flagship sheet is a `stack`: the flagship page, and below it a README page (`ReadmeSlide`) with long form text from `content/en/readmes/<slug>.md`, headed by the project's `built` note (the problem and how it's solved). The text scrolls inside the page; the wheel and ↑/↓ scroll it first and move to the next page once the end is reached. Any element marked `data-scroll` inside a stack slide behaves this way.

Whenever there is a page below the current one, a down arrow sits at the bottom centre (`.deck-down`, styled by the theme). A page above gets an up arrow at the top centre; on a post, "All posts" (a double arrow and label, set off from the single arrow by a short rule) sits left of it (back to the list; on phones the button stays in the post's header). Left and right arrows at the middle of the side edges lead to the neighbouring sheets on every sheet. All four arrows are bare accent-coloured arrows of one size, without any movement. On first load they fade in as the first bush flowers open (2.5s), and the resting butterfly with them.

### 06 · Projects (`stack`)
- **Slide `main`:** columns for **Granum, Scry, Castl3d**. The page below it holds the rest, reached like any page below (down arrow, wheel, ↓).
- **Slide `more`:** **Aether, konvert, Content Automation**, same column layout.
- Card slots: `title`, `tagline`, `stack`, `links`, optional `stats`.

### 07 · Posts (`stack`)
- Top page: the list, newest first, full width (date · title and summary · read). It scrolls inside the page when long.
- Below it one page per post (`PostSlide`), generated from the content (`slidesFrom: 'posts'` in `sheets.config.ts`, filled in by `Deck.vue`). Clicking a post, the down arrow or `/posts/<slug>` opens it; the text scrolls inside the page.
- Each post also keeps its own URL `/posts/<slug>` (for search engines and sharing; the page links back to its deck page).
- Empty state: "Nothing here yet."

### 08 · Timeline
Code and work milestones only, **no school entries**:

| When | Entry |
|---|---|
| 2021 | Started with Java |
| 2023 | Discovered Kotlin |
| 2024 | Spring & Vue |
| 07–08/2025 | Internship, Cloudflight Austria GmbH: employee mobile app, Kotlin Multiplatform |
| 2026 | Backbone, Clay, Granum, Osmium |
| 07–08/2026 | Internship, Cloudflight Austria GmbH: Android app for Last Mile Management, Kotlin + Jetpack Compose |
| next | "Next up" |

### 09 · Skills
Five columns, one per category (the list lives in `content/en/skills.yml`):

| Category | Items |
|---|---|
| Languages | Kotlin, Java, JavaScript, TypeScript, Go, C, C#, Python, Shell |
| Databases | Oracle, MySQL, SQLite, MongoDB, Postgres |
| Frameworks | Kotlin Multiplatform, JavaFX, Vue, Nuxt, Tailwind CSS, React, Spring Boot, Spring Security, JPA / Hibernate, Quarkus, Express, Fabric, Spigot |
| Tools & DevOps | Git, GitHub, GitHub Actions, Docker, Kubernetes, Vite, Gradle, Maven, Flyway, Swagger |
| Testing | Jest, JUnit, xUnit, Playwright, Selenium |

Clicking a skill (or tapping it, or Enter / Space) unfolds that row downwards, one at a time (opening another closes it, clicking it again too), pushing the skills below it down: what the skill is, how much I like it as 0 to 5 stars (yellow, the rest grey), and why. Its name and icon turn the accent colour (on hover too, so it reads as clickable); the text lines up with the icon. Each column is as tall as the space left on the sheet; skills pushed past its bottom fade out. An opened skill never does: its list moves up while it unfolds, so it fits (the skills above fading at the top, the fades set from the start), and back down when it closes. My favourites (`favorite: true`) have a small accent star left of the icon; every row keeps a slot for it, so the icons stay in line. A subheading under the title says how to open one ("click" with a mouse, "tap" on touch screens).

### 10 · Contact
- Heading, the lead ("Email is the fastest way to reach me, / or just write me a message here →", the second line a link that opens the contact form), the email large (mailto), links.
- Then the CV note, a closing "Done." and, small under it, "Last updated <date>." (the build date, so at most a day old with the daily rebuild).
- The link opens the contact form (`ContactForm.vue`, mounted in `Deck.vue`, state in `useContactForm`) over the page as a pixel-art postcard that blows in on the wind (tumbling, a few pixel petals drifting past) and lands straight (no tilt, so it reads and types like a form): "Hi Erik," in the pixel font and the message on ruled lines on the left with a pixel flower sprig over the corner; on the right a perforated stamp with the pixel butterfly, "to Erik Reitbauer", and "from" / "reply to" on ruled lines. Sending (button or ⌘/Ctrl+Enter) presses a postmark with the date onto the stamp, then the card blows away and "Sent" shows for a moment. On phones the halves stack, address first. Esc, the close button or a click outside closes it; the deck ignores keys and the wheel while it is open. Sending posts to `/api/contact` (`server/api/contact.post.ts`): fields are checked, Cloudflare Turnstile (loaded when the form first opens, invisible unless it has doubts) is verified, and the message goes to my inbox through Email Routing (`send_email` binding `EMAIL`) with the sender as Reply-To. A hidden field catches bots. Settings: `NUXT_PUBLIC_TURNSTILE_SITE_KEY` (build variable), `TURNSTILE_SECRET_KEY`, `CONTACT_TO` (a verified Email Routing destination), `CONTACT_FROM` (an address on integr.cc) as Worker secrets. In dev, Cloudflare's Turnstile test keys are used and the message is only logged.
- Email: **hello@integr.cc**
- GitHub: `integr-dev`, `e-reitbauer` · Modrinth
- Line: **"CV available on request."** No download, no CV section.
- End marker: **"Done."** This is the last element on the last sheet.

### Always excluded
Phone, street address, exact birthdate, school history, CV file, extracurriculars from school.

---

## 6. Content model (files)

```
content/
  en/                       # English: the source of all content
    profile.yml
    projects/
      osmium.md  clay.md  forkcast.md  backbone.md  helix.md
      granum.md  scry.md  castl3d.md
      aether.md  konvert.md  content-automation.md
    readmes/
      osmium.md  clay.md  forkcast.md  backbone.md  helix.md
    posts/
      2026-09-27-new-page.md
    timeline.yml
    skills.yml
  de/                       # German: only the translated text, laid over the English file of the same name
    profile.yml  timeline.yml  skills.yml
    projects/
```

The language folder is not part of a page's path: `content/en/posts/x.md` is `/posts/x` (the collections' `prefix` in `content.config.ts`).

### Project frontmatter
The schema is enforced in `content.config.ts`.
```yaml
---
title: Helix
tagline: A quality of life mod for Fabric.
tier: flagship            # flagship | featured | more
order: 5                  # order inside its tier
why: Shipped to real players and still downloaded.       # flagships only
built:                                                    # optional: one problem and how it's solved
  problem: "…"
  solution: "…"
badge: { value: "1,400+", label: downloads on Modrinth, href: https://modrinth.com/mod/helix, live: "modrinth:downloads:helix" }
stats:                    # numbers, always with a date and a source
  asOf: "2026-09-27"
  source: https://modrinth.com/mod/helix
  items:
    - { label: downloads, value: "1,454", live: "modrinth:downloads:helix" }   # numbers with English commas; a month as "2026-08"
stack: [Kotlin, Java, Fabric]
links:
  - { label: Source, href: https://github.com/integr-dev/helix }
visuals:                  # optional, one or more; several form a carousel
  - kind: images          # images | code | diagram | chart
    label: Screenshots    # tab label
    images:
      - { src: /img/helix.webp, alt: Helix settings menu in game, width: 515, height: 301 }  # size reserves the space, no layout shift
  - { kind: diagram, label: Diagram, diagram: osmium }
  - kind: chart           # bar chart; a project badge is shown above it
    label: Downloads
    chart: { title: Downloads per release, note: "...", source: "https://...", bars: [{ label: "1.2.1", value: 155 }] }
---
Longer description (Markdown). For `kind: code` the body is the code block shown as the visual.
```

- `tier: flagship`: own sheet (listed in `sheets.config.ts`). `kind: diagram` picks a component from `app/sheets/diagrams/` by name. With more than one entry in `visuals` the sheet shows a carousel (arrows plus labelled dots). Pages share one spot: the current one fades out, then the next is drawn in its place. Adding screenshots later never replaces a diagram, it adds a page. A screenshot page lays its images out in rows, none overlapping, in their order: the images of a row are equally tall and fill its width, and the rows are chosen so the whole block is about 1.3:1 and as large as the sheet's height allows (`shotLayout`). Each sits in a drafting frame (outline, accent corner ticks, a typed `fig.01` label). A click opens the large preview, which is drawn in (edges ruled round the frame, the picture drawn block by block like on the page) and its frame drawn out backwards when closed.
- `live` (optional, on a stats item or the badge): where the production build fetches a fresh number from, e.g. `github:commits:integr-dev/osmium`, `github:commits:clay-doc/*` (summed over an owner's repositories), `github:stars:…`, `github:repos:<owner>`, `github:contributors:…`, `github:commits-by:<repo>@<login>`, `modrinth:downloads:<slug>`, `modrinth:followers:<slug>` (full list in `modules/live-stats.ts`). The fetched numbers replace the file's, with the build date as `asOf`; a badge shows its number rounded down to the hundred with a "+". If a project's numbers can't all be fetched, it keeps the file's numbers and date. Only the production build fetches (`LIVE_STATS=1` in dev); an optional `GITHUB_TOKEN` build variable lifts GitHub's limit of 60 requests an hour; if GitHub turns the token down (expired or revoked: 401/403), the build warns once and goes on without it. The Worker rebuilds the site every day at 04:00 UTC (a cron trigger calls the build's Deploy Hook, the `DEPLOY_HOOK_URL` secret; `server/plugins/daily-rebuild.ts`), so the numbers stay current.
- `tier: featured`: a row on Projects/main.
- `tier: more`: a row on Projects/more.

### Post frontmatter (adding a post = adding one file)
```yaml
---
title: Why Osmium splits jobs into segments
date: 2026-09-27
tags: [osmium, architecture]
summary: Short teaser for the feed.
draft: false
---
Markdown body. Code blocks, images, embeds.
```
Rules: the filename becomes the slug (`YYYY-MM-DD-slug.md`). `draft: true` keeps a post out of the build. The feed and the search index pick posts up automatically.

### timeline.yml / skills.yml / profile.yml
```yaml
# timeline.yml
entries:
  - when: "07/2025 – 08/2025"
    title: Internship, Cloudflight Austria GmbH
    detail: Mobile app for employees, built with Kotlin Multiplatform.
```
```yaml
# skills.yml
categories:
  - category: Languages
    items:
      - { name: Kotlin, what: "What it is, one line.", rating: 5, why: "Why that rating.", favorite: true }   # rating, why and favorite optional
```
```yaml
# profile.yml
handle: integr
name: Erik
birth: { year: 2009, month: 5 }   # only used to compute age; never rendered
location: Austria
pitch: "…"
email: hello@integr.cc
cvNote: CV available on request.
links:
  - { label: integr-dev, href: https://github.com/integr-dev, icon: github }   # icon: Font Awesome name
```

---

## 7. Search (Scry-style)

- Opens with `/`, `⌘K` or `⌥Space`. Closes with `Esc`.
- Index is built at generate time from: projects (all tiers **including `more`**), posts, timeline, skills, and sheet titles.
- Each result: `{ label, kind, text, sheetId, slideId?, anchor?, to? }` (`app/deck/useSearch.ts`).
- Match modes: literal first, then fuzzy.
- On select: navigate to `(sheetId, slideId)`. If the target slide has `hiddenUntilRevealed` (supported, currently unused), unlock it first. Then highlight the matched element for a moment.
- Posts open at `/posts/<slug>`.

---

## 8. Decoration contract

A theme is one folder. Its `index.ts` exports an object matching `Theme` in `app/themes/types.ts`:

```
app/themes/<name>/
  index.ts                # imports the CSS, exports the Theme object
  tokens.css              # all CSS variables below, light + dark
  <name>.css              # decoration: draw-in motion, search-hit highlight, code colors, shared bits (.rule, .chip)
  ThemeBackground.vue     # full-viewport background layer
  ViewportFrame.vue       # fixed frame around the viewport
  DeckIndicator.vue       # position UI
  SearchSkin.vue          # visual shell of the search (logic stays in app/deck/SearchBar.vue)
  builder.ts              # draws sheets live (see Build system)
  PenOverlay.vue          # BuildOverlay: construction guides (behind) and the pen (in front)
  ButterflySprite.vue     # the pixel butterfly, shared by the pen and the ornament
  <Ornament>.vue          # optional, reacts to search hits (drafting: the butterfly)
```

Active theme: `app/themes/active.ts` re-exports one theme folder. Swapping the decoration means changing that one line.

The deck moves sheets itself (a translated track), so a theme controls motion through `--transition-duration` / `--transition-ease`, not through a transition component.

### Build system (the page is drawn live)
Every time a sheet or stack slide comes into view it is drawn again, element by element. When you leave, it is reset, so the next visit draws it again. The structure (`app/deck/useBuild.ts`) decides **when**; the theme's `builder` decides **how**.

- Deck layout: builds start when a sheet or slide becomes active, after the slide transition. The previous one resets once it is off screen.
- Narrow layout: builds start when a sheet scrolls into view and reset when it has fully left.
- `data-build-pace` on a container draws its parts at that fraction of the speed, effects and the gaps between them (the flagship's text column: `0.7`, so it can be read along).
- Lazy hydration (`app/deck/hydration.ts`): every sheet is in the prerendered page, but its code is loaded and made live only when needed. The sheet components are async (`app/sheets/index.ts`) with a hydration strategy that waits until the deck asks for them: the sheet on screen at once, the positions one step away (sheets left and right, pages above and below) once that sheet is live and the browser is idle, and on phones a screen and a half before a sheet scrolls into view. A sheet is drawn only once it is live (drawing splits text into letters, which a later hydration would trip over). Their chunks are left out of the page's preload hints (`build:manifest` hook in nuxt.config). Images in the sheets are `loading="lazy"` and are fetched when their sheet is got ready or drawn.
- The decoration starts with the drawing, not with the page load (`app/utils/drawing.ts`): the first sheet starting to draw marks `<html>` as `.is-drawing`; the bushes, the title block, the arrows and the butterfly wait for it, so on a slow connection they do not grow long before the content.
- Loading indicators show only for what takes longer than `LOADING_GRACE` (300ms): a sheet whose code is still loading turns its marker in the title block into the pixel spinner (`PixelSpinner.vue`), a search result on a sheet that is not live yet keeps the search open with the spinner in the box, and a slow language switch turns `EN`/`DE` into the spinner. The other language's texts are fetched in the background once drawing has started.
- Loading bar on slow connections (`server/plugins/boot-progress.ts`): while prerendering, each page gets a tiny script that knows the sizes of the files the app needs to start. If some are still missing 800ms after the page arrived, a thin accent line with "loading 42%" shows along the top edge of the frame: the downloads make up 85% (the bytes still on their way estimated from the throughput so far), starting the app and the first sheet the rest; it runs to 100% and fades as drawing starts.
- Loaded on first use: the screenshot preview, the contact form and the search panel (fetched in the background once drawing has started). Studio's editor and Nuxt Content's in-browser database are never prefetched. `experimental.payloadExtraction` is off: the whole deck and its data come with the first page, so moving around and switching languages fetches no `_payload.json`.
- Reduced motion: `builder.finish()` shows everything at once.
- Speed: the first visit to a sheet draws at 0.8x, later visits at 1.5x (`useBuild.ts`). Every effect scales with it; custom elements get `speed` in the `build-run` event.
- The title block receives `progress` (0..1) and shows the percentage, then "Done". On hover or keyboard focus the marker row grows and each marker shows its sheet name in vertical text (click to jump; it collapses after the click until the pointer leaves).
- The event `deck:built` fires on `window` when a build completes. Search waits for it before highlighting.

Sheets mark elements, and the order in the DOM is the drawing order. The pen visits every visible piece of content and marks it. It skips controls and decoration: buttons, anything inside `[data-nopen]` (carousel navigation, key hints, link rows), ruled lines, parts nested inside another built element, and elements smaller than 16px. Inside an SVG only shapes with `data-pen` are visited; small SVG parts are drawn in quick succession. Anything inside `[data-build-skip]` (carousel pages not showing) is left out. Any element with `data-build-root` can be built on its own; the search panel uses this and is taken apart again with `builder.unbuild()` when it closes.

| `data-build` | drafting theme does |
|---|---|
| `type` | types the text behind a caret (headlines, short labels) |
| `print` | reveals top to bottom in line steps (paragraphs, code) |
| `line` / `vline` | rules the line from one end |
| `path` | strokes an SVG shape (`pathLength="1"`) |
| `count` | counts a number up from 0 (keeps the thousands separator as written, `1,400` or `1.400`, prefixes, suffixes) |
| `chips` | a list: every child is its own step and gets its own pen visit (stats values, tech chips, skills, links). Built parts inside a child (like a counting number) start together with it |
| `image` | draws the image block by block, rows sweeping down (a canvas laid over the image, same effect as the avatar) |
| `fade` | fades in |
| `custom` | the element animates itself: it receives `build-run` (`detail: { resolve, signal }`), `build-reset` and `build-finish` |

While drawing, the drafting theme moves the pen (a butterfly with an `x / y` readout) to the bottom-right corner of each element. The element the pen is on gets construction marks: extension lines through its corners, a dashed box with corner ticks, its width and height, and a baseline under headings. Only the current element is marked; the marks vanish the moment the pen moves on. For text the box fits the text itself, not its container. The marks sit behind the sheets, so they never cross text. The custom element on this site is the intro avatar (drawn block by block). The architecture diagrams (Osmium, Clay, Forkcast) share one style (`app/sheets/diagrams/diagram.css`: boxes with a label and note, module cells, wires with arrow heads) and show traffic flowing along their wires once the sheet is drawn (`.is-built`).

Search hits get the class `.is-search-hit` for a few seconds, and the theme styles it.

**Rule:** never put a Vue `:class` binding on an element that has `data-build`. The builder adds its own classes (`b-run`, `b-done`) to that element, and Vue rewrites the whole class list when its binding changes, which makes the element count as undrawn and hide. Put the bound class on a wrapper or an inner element instead.

### Required tokens
```
--bg, --surface, --surface-raised, --bg-grid, --bg-grid-strong,
--fg, --fg-muted, --line, --line-strong, --secondary,
--accent, --accent-wash, --accent-contrast, --code-bg,
--font-display, --font-body, --font-mono,
--radius, --frame-gap, --transition-duration, --transition-ease
```

### Props each slot receives
| Slot | Props |
|---|---|
| `ThemeBackground` | `x`, `total` |
| `ViewportFrame` | none |
| `BuildOverlay` | none (reads the builder's own state) |
| `DeckIndicator` | `x`, `total`, `y`, `yTotal`, `titles`, `ids`, `visited`, `handle`, `progress`; emits `go(i)`, `prev`, `next`, `up`, `down`, `search` |
| `SearchSkin` | `open`, `query`, `results`, `activeIndex`; emits `select`, `close`, `update:query`, `move(delta)` |
| `Ornament` | `target: { anchor, nonce } \| null` |

### Default theme: `drafting`
A technical-drawing look in moss green. Colors come from the Osmium theme and the avatar.

Bushes (`PixelBush.vue`, part of the background): pixel bushes in the avatar's greens grow around the bottom-left and top-right corners on load (and a smaller one top left) (a round mound at the corner, tapering along both edges), leaf by leaf outward from the corner, then small white flowers open on their inner edge. Generated from a seed (same on server and browser); size in bush pixels via `width`, `height`, `thickness`, and `mound` (the corner mound; lower is more L-shaped); behind the sheets, in front of the frame line and the paper. Small patches of different sizes (`corner` `bottom` / `top` / `left` / `right` with `at` along the edge) stand on the edges after the corners have grown, unevenly spread and partly in little groups, each a low mound with a flower or two, kept clear of the arrows in the middle of the edges and of the title block. No bushes or patches on phones. Where the window's shape differs from the reference window (so the zoomed page is wider or taller than 1694 x 971), ThemeBackground measures the gaps along each edge after mounting and on resize and fills any longer than 520px (the widest gap in the reference layout is 498px) with tiny patches, no bigger than the smallest placed one (5 x 3), keeping the arrows and the title block clear. Vines (`PixelVine.vue`) hang into the empty right half of the intro sheet: two out of bush patches on the top edge, left of the shortcut buttons (IntroSheet measures where the button group starts, `intro-links-left`; the run of top-edge patches ends at the buttons too), one out of the top-right bush. They wander sideways with leaves on alternating sides and a few flowers. They are drawn on the background layer (ThemeBackground's `.vine-layer`, under the bushes and the sheets, shifted along with the deck), and follow the intro's drawing through an empty `data-build="custom"` cue in the sheet (state `intro-vines`: idle, run, done, leaving): they grow down their length once it runs, come apart from the tip back up and fade while the deck slides off the intro, and are hidden on phones.

Light or dark: `data-theme` on `<html>`, set before first paint by the head script in `nuxt.config.ts` (the saved choice in `localStorage.theme`, else the system setting, which it keeps following until a choice is made). The sun/moon button in the title block switches it (`useThemeMode`); with the View Transitions API the new colours spread over the page as a circle from the click, otherwise (and with reduced motion) it switches at once. Phones hide the title block and follow the system.

| Token | Dark (default when the system is dark) | Light (paper) | Source |
|---|---|---|---|
| `--bg` | `#111812` | `#F2EDDB` | Osmium base / cream paper |
| `--surface` | `#1B241C` | `#E9E3CD` | Osmium base-200 |
| `--bg-grid` | `#80B55F` @ 8% | `#4F7A3A` @ 10% | Osmium primary |
| `--fg` | `#ECE4C8` | `#1F2A20` | avatar cream / ink |
| `--fg-muted` | `#B9B08C` | `#55604F` | avatar |
| `--line` / primary | `#80B55F` | `#4F7A3A` | Osmium primary |
| secondary (chips) | `#91964E` | `#6E7236` | avatar leaves |
| `--line-strong` (frame, rules) | `#6B5638` | `#6B5638` | avatar wood |
| `--accent` | `#E8D56A` | `#9A7A1E` | avatar butterfly |

- No orange anywhere.
- The accent is used only for active things: the pen dot, keyboard focus, the current tick in the title block, and search matches (as a highlighter wash at about 30%).
- Fonts: **JetBrains Mono** (labels, numbers, code) + **Schibsted Grotesk** (text) + **Jersey 10** (`--font-pixel`, drawn in its one weight `--font-pixel-weight`, no synthesized bold: the main title of every sheet, the intro name, the Helix download number, the 404 page). Schibsted Grotesk and JetBrains Mono only in 400 and 700 (every weight is one more font file to load).
- Icons: **Font Awesome 6 Free** (solid + brands), the same pack the previous site used. Only their path data is used (`app/utils/icons.ts`), drawn as a plain `<svg>` by `components/Icon.vue` (`<Icon icon="arrow-right" />`), without Font Awesome's runtime and stylesheet. No Lucide or other UI icon sets. Exception: technology logos on the Skills sheet come from **Simple Icons** (monochrome brand logos Font Awesome does not have, `app/sheets/skillIcons.ts`), with Font Awesome fallbacks.
- Butterfly: a small pixel sprite in the accent yellow (the butterfly from the avatar, `ButterflySprite.vue`). It rests on the title block and flies to the matched element when a search result is picked. Hovering or clicking it plays a random trick (hop, spin, loop, turn, dash, shake). While the title block is expanded it keeps flying from one random spot to the next, and lands back on it once it collapses. The title block announces this with the window events `titleblock:expand` / `titleblock:collapse`. While a sheet is being drawn it hides, and the pen, drawn as the same butterfly, does the work. Hidden under `prefers-reduced-motion`.
- Logo / favicon: the GitHub avatar (pixel cat) with rounded corners, `public/logo.png`. Pixel art is rendered with `image-rendering: pixelated`.

**Frame.** The viewport is a fixed drawing frame (`ViewportFrame`), and sheets move inside it. A **title block** in the bottom-right corner is the position UI (`DeckIndicator`): logo, handle, current sheet title, one tick per sheet (click to jump), up/down arrows when the sheet has vertical slides, the search button and prev/next. No "03 / 10" counters. Every sheet keeps 150px free at the bottom for it.

**Animation.**
- First load: paper and grid fade in, a pen dot traces the frame, then the intro is drawn.
- Every visit to a sheet: the sheet slides in empty and is drawn live (see Build system above), about 2 seconds. Images drawn block by block may keep going a little longer.
- Horizontal move: the paper slides and the grid scrolls continuously, like one long roll. The frame stays fixed. Vertical moves work the same way on y.
- Search pick: navigate there, then a highlighter wash on the match that fades.
- `prefers-reduced-motion`: everything is shown already drawn, with no transitions.
- No bounce, no blur-in, no glow.

---

## 8a. Anti-AI-look rules (hard rules for every theme and all copy)

| Don't | Do |
|---|---|
| Inter, Geist, Space Grotesk, Instrument Serif, italic serif accent word | The theme's chosen fonts |
| Gradients on backgrounds, text or buttons; colored glows / box-shadows | Flat color, 1px lines |
| Always-dark theme with grey body text | Light + dark following the system, cream text, contrast checked (WCAG AA) |
| Centered hero, badge/pill above the H1, eyebrow labels over headings | Left-aligned hero, headings stand alone |
| Colored top/left border on cards | Ruled lines, tables, register rows |
| Identical icon-card grids | A different layout per sheet |
| Decorative "01 / 02 / 03" numbering | Let order and content speak |
| Stats without a source | Every number links to its source, with an `asOf` date |
| Text where an image belongs | Real screenshots, the avatar |
| Em dashes in UI copy | Period, comma, colon |
| Emoji as icons | Plain text or simple line glyphs |

---

## 9. Project layout

```
nuxt.config.ts              # modules, fonts, code highlighting, head
content.config.ts           # content schemas (§6)
app/
  app.vue                   # loads the active theme
  error.vue                 # 404 page, drawn with usePageBuild
  router.options.ts         # path changes never scroll
  assets/base.css           # structure-only CSS (reset, .sheet box)
  plugins/studio-stage.client.ts # lays the page out right of the Nuxt Studio panel while it is open
  composables/useSiteContent.ts   # all content queries, ageFrom, formatDate
  deck/
    sheets.config.ts        # §4
    types.ts
    Deck.vue                # track, input (keys, wheel, touch), narrow layout
    useDeckNav.ts           # position state, path sync, unlock
    paths.ts                # deck position <-> URL path
    useBuild.ts             # when sheets are drawn and reset
    useSearch.ts            # index + matching
    SearchBar.vue           # search logic, renders the theme SearchSkin
  sheets/
    index.ts                # component registry for sheets.config.ts
    IntroSheet.vue  PixelAvatar.vue  FlagshipSheet.vue  ProjectListSlide.vue  PostFeedSheet.vue
    TimelineSheet.vue  SkillsSheet.vue  ContactSheet.vue
    diagrams/               # OsmiumDiagram.vue, ClayDiagram.vue, ForkcastDiagram.vue, diagram.css (shared look)
  pages/
    [...slug].vue           # every path: applies the position, per path SEO, mounts <Deck>
  themes/
    types.ts  active.ts
    drafting/               # §8
content/                    # §6
public/                     # logo.png, favicons, img/
```

Commands: `npm run dev`, `npm run build` (the Worker in `.output/server`, the prerendered pages in `.output/public`), `npm run generate` (static pages only).

---

## 8a. Size on screen

The page is laid out for a reference window of 1694 x 971 (a MacBook browser window) and zoomed to fit any other window wider than a phone: `zoom` on the app (`#__nuxt`, base.css) = `--zoom` = min(width / 1694, height / 971), not below 0.6, set before first paint and on resize by the head script in nuxt.config. `<html>` itself stays unzoomed, so what others put into the page (password manager menus, the browser's autofill, the Studio panel) keeps its own size and lands where it measures. So large screens and browser zoom show the same picture, just bigger or smaller; phones (< 768px) keep their own layout at zoom 1. Zoom scales viewport units and on-screen positions as well, so sizes taken from the window use `var(--vw)`, `var(--vh)`, `var(--dvh)`, `var(--svh)` (base.css; they divide the zoom out) instead of `vw`/`vh`, and positions read with getBoundingClientRect or from pointer events are converted with `unzoomRect()` / `pageZoom()` (`app/utils/zoom.ts`) before being used for placement.

Nuxt Studio (`nuxt-studio`, config `studio` in nuxt.config) edits the content in the browser; in dev it writes straight to `content/`. While its editor panel is open at the left of the window, the page is laid out as in a window that starts right of it (`plugins/studio-stage.client.ts`): Studio's push of the body and its inline `left` on fixed elements are undone, `#__nuxt` moves over by the panel's width and holds the fixed elements (`contain: layout`), the zoom and `--vw` are worked out from the width that is left (`--stage-left`, `window.__stageLeft`), `unzoomRect()` counts from the panel's edge and `stageWidth()` replaces `innerWidth`. The panel sits outside the zoomed app, so it keeps its own size and its tooltips land in place. Studio rewrites a file it saves (keys sorted, YAML comments dropped), so notes about content live in `content.config.ts` and here, not in the content files. The theme is mirrored as a `dark` class on `<html>`, which Studio follows. `<nuxt-studio>` is pinned top left above everything (else its panel takes no clicks). Keys, wheel and taps from the panel (`fromStudio()`, `app/utils/studio.ts`) are left to it: the deck and the builder ignore them.

## 8b. Languages (English, German)

- `@nuxtjs/i18n`, `prefix_except_default`: English at the plain paths, German under `/de` (`/de/projects/osmium/readme`). No redirect by browser language. Switch: `EN`/`DE` in the title block, to the same position in the other language. Switching swaps the texts in place, nothing is drawn again: both languages are loaded together (`useSiteContent` picks one by locale), and just before the switch the builder's `release()` puts back the text it split into letters, so Vue can patch it.
- UI text: `i18n/locales/en.json` and `de.json`. Labels that come from the content (stat names, visual names) are translated when a message exists under `stats.*` / `visual.*`, else shown as written.
- Content: English is the source. `content/de/` holds only the translated text and is merged over the English entry with the same name (`useSiteContent`): `de/profile.yml` (role, location, lookingFor, pitch, cvNote), `de/timeline.yml` (whole file), `de/skills.yml` (category names and each skill's `what`/`why`, matched by name; names, order and ratings from the English file), `de/projects/<name>.md` (tagline, why, built, badgeLabel, chart title and note, image alts in order, and the body when it is text). Readmes, posts and the RSS feed stay English. Diagram texts are messages under `diagram.<name>.*` (file names and tech names stay as they are). Stat and badge values are shown in the reader's format: `1,400` becomes `1.400` in German, a month `2026-08` becomes `Aug 2026` / `Aug. 2026`.
- Dates: `formatDate(iso, withDay, lang)` (German months, `27. Sep. 2026`).
- SEO: `<html lang>`, `og:locale`, titles and descriptions per language; every page links both versions (`hreflang` en, de-AT, x-default = English); the sitemap lists both. Preview images per language: German pages use `public/og/de.png` and `public/og/de/...` (card words, date and taglines in German; post titles stay English).

## 9a. Search engines and sharing

- `app/composables/useSiteSeo.ts`: per page title, description (under ~155 characters), canonical URL, Open Graph and Twitter cards, and schema.org data. Home: `ProfilePage` + `Person` (full name, alternate names, role, country, `sameAs` both GitHub accounts and Modrinth, `knowsAbout` from skills.yml) + `WebSite`. Posts: `BlogPosting` with the same `Person` as author.
- Every deck position is prerendered as its own page (`/posts.html`, `/projects/osmium/readme.html`, no subfolder index, so no trailing slash redirects) with its own title, description, canonical URL, preview image and schema.org node (`useDeckSeo` in `useSiteSeo.ts`): `ProfilePage` on `/`, `SoftwareSourceCode` on flagships, `BlogPosting` on posts.
- `server/routes/sitemap.xml.ts` (prerendered): every deck position and every published post. `public/robots.txt` points to it.
- `server/routes/feed.xml.ts` (prerendered): RSS 2.0 feed of the posts, linked in `<head>` and from the Posts sheet.
- `public/og.png`: 1200×630 preview image for the home page. Posts and flagships have their own in `public/og/posts/` and `public/og/projects/`, generated by `python3 scripts/og.py` (Pillow, PyYAML; fonts in `scripts/fonts/`), which also writes the German set under `public/og/de`. Rerun it after adding or editing a post or project and commit the images.
- The 404 page is drawn like the deck: `usePageBuild()` draws each `[data-build-root]` section once as it scrolls into view, one at a time with the same pen; a click or Space/Enter/Esc finishes it.
- `app/error.vue`: the 404 page in the same style. For unknown URLs Cloudflare serves the prerendered `404.html` (an empty app shell, as Nuxt renders it without SSR) with status 404; the app then finds no deck position for the path and shows this page.
- `profile.yml`: `fullName`, `role` and `lookingFor` feed the intro and the metadata.

## 9b. GitHub profile readmes

- The readmes of both accounts (`readme/integr-dev.md`, `readme/e-reitbauer.md`; copied by hand into the `README.md` of the `integr-dev/integr-dev` and `e-reitbauer/e-reitbauer` repositories) are short text between images the site draws: a header (avatar drawn in block by block, name typed, a button to the site, bushes, the butterfly), the section titles, stats and languages, the contribution garden, recent activity and the newest post, and the button to the site. Everything that changes is in an image; the text in the readmes is static.
- `modules/readme/` draws them on every build as SVG, light and dark (`/readme/<name>-<light|dark>.svg`, cached an hour; the readmes pick one with `<picture>`, which GitHub matches to the visitor's theme). The numbers are summed over both accounts from GitHub's GraphQL API (needs the `GITHUB_TOKEN` build variable; without it, as in dev, they are made up), the newest post comes from `content/en/posts`. The daily rebuild keeps them current.
- The images use the site's colours, the bush generator (`app/themes/drafting/bush.ts`, shared with `PixelBush.vue`) and its fonts, embedded as subsets from Google Fonts; text is laid out with the fonts' real glyph widths. Each image animates in once. Animations inside an image are limited: only whole elements (no tspans), and a discrete change late in the image has to be a forwards fill.
- In dev, the module runs when the dev server starts: after changing it, restart the dev server fully (a reload keeps the old module code).

## 10. Open items
- Osmium has no screenshot yet. It uses a diagram until one exists.
- Final wording of the intro pitch and the "why" lines.
- Should stats be refreshed at build time from the GitHub/Modrinth APIs, or stay static with `asOf`? Default: static.

## Drafts to check

Content still marked as a draft (the notes used to be YAML comments in the files):

- `content/en/profile.yml`: `lookingFor` (shown on the first screen).
- German wording: `content/de/skills.yml`, `content/de/timeline.yml`, `content/de/profile.yml` and every file in `content/de/projects/`.
