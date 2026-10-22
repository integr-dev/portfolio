---
title: Clay
tagline: Turns a folder of Markdown into a fast, searchable docs site, ready for readers, search engines and AI agents.
tier: flagship
order: 1
why: A complete product I designed and maintain under its own organisation. Published on npm as clay-doc, now at version 5, and its own documentation is a Clay site.
built:
  problem: "Most documentation tools want a project to adopt a static site generator, a theme and a build of its own."
  solution: "Clay is one npm package with a command line. A repository adds it as a dev dependency, writes Markdown in docs/ and a clay.yaml, and clay build pre-renders every page into a static site, with a search index, a sitemap, social images and a Markdown copy of every page for AI agents. The same build checks links and settings."
stats:
  asOf: "2026-10-22"
  source: https://github.com/clay-doc
  items:
    - { label: repositories, value: "2", live: "github:repos:clay-doc" }
    - { label: commits, value: "248", live: "github:commits:clay-doc/*" }
    - { label: stars, value: "4", live: "github:stars:clay-doc/*" }
stack: [Vue, Nuxt, TypeScript, Node.js, Tailwind CSS, Shiki]
links:
  - { label: Live demo, href: https://clay-doc.github.io/clay-example-repo/ }
  - { label: Source, href: https://github.com/clay-doc/clay }
  - { label: npm, href: https://www.npmjs.com/package/clay-doc }
  - { label: Example, href: https://github.com/clay-doc/clay-example-repo }
visuals:
  - { kind: diagram, label: Diagram, diagram: clay }
  - kind: images
    label: Screenshots
    images:
      - { src: /img/clay-home.webp, alt: The start page of the Clay documentation with the sidebar, a terminal style code group and the page menu, width: 1600, height: 900 }
      - { src: /img/clay-api.webp, alt: An OpenAPI page of the Clay documentation with a request cell to try the endpoint and an example response, width: 1600, height: 900 }
      - { src: /img/clay-search.webp, alt: The search palette in the dark theme with results grouped by page and filtered by section, width: 1600, height: 900 }
---
Pages are plain Markdown in `docs/`, with tabs, steps, cards, diagrams, math and OpenAPI pages in the same syntax. `clay dev` previews every change live, and `clay edit`, `clay check` and `clay search` let people and coding agents rework the docs from the terminal. Versions, translations, themes and cookie-free analytics are set in `clay.yaml`.
