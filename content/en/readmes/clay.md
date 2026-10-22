---
title: Clay
description: "Clay turns a folder of Markdown files into a fast, searchable documentation site that readers, search engines and AI agents can all use. It is one npm package, clay-doc, built on Nuxt and Vue: a repository installs it, writes its pages in docs/, and clay build writes a static site that runs on any host, such as GitHub Pages. There is no theme to set up and no code to write."
---

Clay turns a folder of Markdown files into a fast, searchable documentation site that readers, search engines and AI agents can all use. It is one npm package, [clay-doc](https://www.npmjs.com/package/clay-doc), built on [Nuxt](https://nuxt.com/) and [Vue](https://vuejs.org/): a repository installs it, writes its pages in `docs/`, and `clay build` writes a static site that runs on any host, such as GitHub Pages. There is no theme to set up and no code to write.

> Clay documents itself: the [live demo](https://clay-doc.github.io/clay-example-repo/) is Clay's own documentation, built with Clay.

## Capabilities

- **Pre-rendered pages** that load fast, work without JavaScript and fit small screens.
- **Full-text search** across every page and section, grouped by page, typos forgiven.
- **Clay Flavored Markdown**: tabs, steps, cards, details, badges, math, diagrams, file trees, prompts, videos and embeds, written in plain Markdown, plus snippets and variables to write a text once.
- **OpenAPI pages** with request cells to try an endpoint right on the page.
- **Ready for AI**: every page as Markdown, `llms.txt`, a page menu to open a page in ChatGPT or Claude, and commands coding agents understand.
- **Versions and translations**, with switchers that keep the page you are reading, and redirects for pages that moved.
- **Your look**: colors, corners and fonts in `clay.yaml`, light and dark themes.
- **Analytics without cookies** through Plausible, Umami or GoatCounter, including searches that found nothing and a "Was this page helpful?" question.
- **SEO**: canonical links, structured data, a sitemap and a social image for every page, in any script and with emoji.
- **Checks** for broken links, missing sections and config typos; `--strict` turns them into build failures.

## How It Works

Clay lives in the repository as a dev dependency. Everything it needs comes from two places: the Markdown in `docs/` and one `clay.yaml`.

```text
.
├── docs/                    # The pages (Markdown)
│   ├── index.md
│   ├── index.de.md          # The same page in German
│   ├── _snippets/           # Text to reuse, not pages of their own
│   └── guides/
│       └── setup.md
├── clay.yaml                # Configuration; only the title is required
└── package.json             # clay-doc as a dev dependency
```

At build time Clay loads the docs, checks every link and setting, turns the Markdown into sanitized HTML and pre-renders each page with its Nuxt app. The output in `publish/public` holds one HTML file per page, the search index, `sitemap.xml`, `robots.txt`, `llms.txt` and a Markdown copy of every page.

## Commands

| Command               | Purpose                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `clay dev`            | Live preview while you write                                                                   |
| `clay build`          | Build the static site                                                                          |
| `clay preview`        | Serve the build the way a web host would                                                       |
| `clay edit`           | Create, order, rename, move and translate pages, in a terminal editor or one command at a time |
| `clay check`          | Check links and settings without building                                                      |
| `clay search <words>` | Find where a topic is written: file, line and section                                          |
| `clay version <name>` | Save the current docs as an older version                                                      |

## Configuration

Only `title` is required. A larger `clay.yaml` might look like this:

```yaml
title: "My Project"
favicon: "logo.svg"
baseURL: "/my-project/"
siteURL: "https://my-org.github.io"
editURL: "https://github.com/my-org/my-project/edit/main/docs/"
version: "5.x"
languages: ["en", "de"]

navbar:
  logo: "logo.svg"
  source:
    name: "GitHub"
    icon: "fa-brands fa-github"
    link: "https://github.com/my-org/my-project"

analytics:
  goatcounter:
    code: "my-project"
  feedback: true

openapi:
  - spec: openapi/petstore.yaml
    title: "Petstore API"
```

## Quick Start

In the repository that holds the docs (Node.js 22.22.3 or newer):

```bash
npm install --save-dev clay-doc
echo 'title: "My Project"' > clay.yaml
mkdir docs && echo '# Hello, Clay' > docs/index.md
npx clay dev
```

## From Clay Oven to one package

Clay started as a prebuilt frontend that read the docs at runtime, filled in by **Clay Oven**, a separate Go CLI that scanned `docs/` and bundled the site. Clay 2 replaced both with the `clay-doc` package, which pre-renders every page at build time, so the browser no longer renders Markdown. Clay 3 to 5 added index pages, versions in folders of their own, components, agent support, themes, analytics, OpenAPI pages and the rest of the command line.

## Repositories

- **[clay](https://github.com/clay-doc/clay)**, the package: the Nuxt app and the `clay` command line.
- **[clay-example-repo](https://github.com/clay-doc/clay-example-repo)**, Clay's documentation, built with Clay and using every feature.
