import { staticPaths } from './app/deck/paths'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxtjs/i18n', 'nuxt-studio'],

  ssr: true,

  runtimeConfig: {
    public: {
      // Cloudflare Turnstile for the contact form; the default is Cloudflare's test key, which always
      // passes (dev). Production sets NUXT_PUBLIC_TURNSTILE_SITE_KEY as a build variable.
      turnstileSiteKey: '1x00000000000000000000AA',
    },
  },

  // Cache lifetimes for the files without a hash in their name (the hashed ones in /_nuxt and
  // /_fonts are kept for a year by default; pages are always checked). Written into _headers.
  // stale-while-revalidate: a cached copy shows at once while a fresh one is fetched behind it.
  // Every path also says: only this site may frame it, and pages it opens get no handle on it
  // (popups still may, for sign-in windows).
  routeRules: {
    '/**': { headers: { 'x-frame-options': 'SAMEORIGIN', 'cross-origin-opener-policy': 'same-origin-allow-popups' } },
    '/img/**': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/og.png': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/og/**': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/favicon-32.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/apple-touch-icon.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/logo.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    // the GitHub readme images (modules/readme): GitHub's image proxy fetches them again after an hour
    '/readme/**': { headers: { 'cache-control': 'public, max-age=3600' } },
    '/skill-icons.svg': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    // the path carries a hash of the messages
    '/_i18n/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },

  experimental: {
    // Every path is the same deck, and its data comes with the first page. Without this, Nuxt fetches
    // the path's _payload.json on every move and every language switch, and waits for it.
    payloadExtraction: false,
  },

  hooks: {
    // The sheets are hydrated lazily (app/deck/hydration.ts), so their code must not be preloaded
    // with the page either: the server renders every sheet, and would otherwise hint them all.
    'build:manifest'(manifest) {
      for (const [key, chunk] of Object.entries(manifest)) {
        if (/(^|\/)sheets\//.test(chunk.src ?? key)) {
          chunk.preload = false
          chunk.prefetch = false
        }
      }
      // Studio's editor (hundreds of KB) and Nuxt Content's in-browser database are for me while
      // editing, not for visitors: never fetched ahead, nor anything only they load
      const noPrefetch = (key: string, seen = new Set<string>()) => {
        const chunk = manifest[key]
        if (!chunk || seen.has(key)) return
        seen.add(key)
        chunk.prefetch = false
        for (const k of [...(chunk.imports ?? []), ...(chunk.dynamicImports ?? [])]) noPrefetch(k, seen)
      }
      for (const key of Object.keys(manifest)) {
        if (/nuxt-studio|database\.client|sqlite/.test(key)) noPrefetch(key)
      }
    },
  },

  // no source maps for the Worker: nobody reads them in production, and they slow the build down
  sourcemap: { server: false, client: false },

  // icons: only their path data, drawn by components/Icon.vue
  build: {
    transpile: ['@fortawesome/free-solid-svg-icons', '@fortawesome/free-brands-svg-icons'],
  },

  css: ['~/assets/base.css'],

  content: {
    experimental: { sqliteConnector: 'native' },
    // on Cloudflare the content lives in the D1 database bound as DB (nitro.cloudflare below)
    database: { type: 'd1', bindingName: 'DB' },
    build: {
      markdown: {
        highlight: { theme: { default: 'everforest-light', dark: 'everforest-dark' }, langs: ['kotlin', 'ts', 'bash', 'yaml', 'json'] },
      },
    },
  },

  // Nuxt Studio: edit the content in the browser at /admin. In dev it writes straight to the files
  // here; in production publishing commits to the repository.
  studio: {
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'integr-dev',
      repo: 'portfolio',
      branch: 'master',
      private: false,
    },
  },

  fonts: {
    providers: { bunny: false, fontshare: false, fontsource: false, adobe: false },
    families: [
      // only the weights in use: every weight is one more font file to download
      { name: 'Schibsted Grotesk', provider: 'google', weights: [400, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 700] },
      // pixel font for the big titles, like the avatar
      { name: 'Jersey 10', provider: 'google', weights: [400] },
    ],
  },

  // English at the plain paths, German under /de (messages in i18n/locales, German content in
  // content/de). No automatic redirect by browser language: the switch is in the title block.
  i18n: {
    baseUrl: 'https://integr.cc',
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-AT', name: 'Deutsch', file: 'de.json' },
    ],
    detectBrowserLanguage: false,
  },

  app: {
    head: {
      // per page titles, descriptions and social cards: app/composables/useSiteSeo.ts
      titleTemplate: '%s',
      meta: [
        // one plain theme-color: Discord colours the embed rail with it and ignores
        // media-scoped (light/dark) variants
        { name: 'theme-color', content: '#80B55F' },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'google-site-verification', content: 'UqFlowAj-jpBkiNTFlVk9K2h6Udzl4luSeYDUNVqZuI' },
      ],
      script: [
        // Before first paint: marks JS as available, so draw-in styles only hide things when they
        // can be revealed, and picks light or dark (the saved choice, else the system setting).
        // Everything wider than a phone is zoomed so the page looks like it does in the reference
        // window (1694 x 971), just bigger or smaller (not below 0.6); browser zoom therefore keeps the
        // same look too. Phones keep their own layout. The script only sets --zoom; base.css zooms
        // #__nuxt with it, and --vw etc. divide it back out.
        // With the Nuxt Studio panel open the window counts from its right edge (__stageLeft).
        // Set here rather than in app.vue: the error page (404) replaces app.vue.
        {
          innerHTML: `(function(){var d=document.documentElement;d.classList.add('js');var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.setAttribute('data-theme',t);function z(){var k=innerWidth<768?1:Math.max(0.6,Math.min((innerWidth-(window.__stageLeft||0))/1694,innerHeight/971));d.style.setProperty('--zoom',k)}z();addEventListener('resize',z)})()`,
          tagPosition: 'head',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  // A Cloudflare Worker: every page is prerendered and served as a static file; the Worker itself only
  // answers what is not (Studio at /admin, its login and API, unknown paths). Deployed by Cloudflare
  // Workers Builds on every push to master (npm run build, then npx wrangler deploy).
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'portfolio',
        // keep the variables set in the dashboard when a build deploys
        keep_vars: true,
        // only integr.cc: no second copy of the site on portfolio.<account>.workers.dev
        workers_dev: false,
        preview_urls: false,
        routes: [{ pattern: 'integr.cc', custom_domain: true }],
        // a daily rebuild for fresh project numbers (server/plugins/daily-rebuild.ts)
        triggers: { crons: ['0 4 * * *'] },
        // Cloudflare serves the prerendered pages itself, and 404.html for any path it has no file
        // for, without starting the Worker. The Worker only runs for Nuxt Studio (the editor, its
        // login and API, its service worker), Nuxt Content's queries while editing, and /api/*
        // (the contact form).
        assets: {
          not_found_handling: '404-page',
          run_worker_first: ['/admin', '/__nuxt_studio/*', '/__nuxt_content/*', '/sw.js', '/api/*'],
        },
        // the contact form mails through Email Routing (server/api/contact.post.ts)
        send_email: [{ name: 'EMAIL' }],
        d1_databases: [{ binding: 'DB', database_name: 'portfolio', database_id: 'a53ffdd4-ff4e-4ebc-8de2-c94b793abf05' }],
      },
    },
    prerender: {
      // every deck position is its own page; the post pages are found by crawling the post list
      crawlLinks: true,
      routes: [...staticPaths(), ...staticPaths().map(p => `/de${p === '/' ? '' : p}`), '/sitemap.xml', '/feed.xml', '/skill-icons.svg', '/404.html'],
      // /posts.html instead of /posts/index.html: Cloudflare serves it at /posts without a trailing
      // slash redirect, so the URLs stay exactly the canonical ones
      autoSubfolderIndex: false,
    },
  },
})
