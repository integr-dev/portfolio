import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseFrontMatter } from 'remark-mdc'
import { rng } from '../../app/themes/drafting/bush'

/** Both of my accounts: every number in the readme images is summed over them. */
export const ACCOUNTS = ['integr-dev', 'e-reitbauer']
// pushed to all the time (Studio, deploys); it would fill the recent activity on its own
const QUIET = ['integr-dev/portfolio']

export interface ReadmeData {
  profile: { name: string, fullName: string, role: string, location: string, pitch: string, email: string }
  /** the last year, one entry per day, oldest first */
  days: { date: string, count: number }[]
  totals: { contributions: number, commits: number, pullRequests: number, issues: number, stars: number, repos: number, followers: number }
  /** share of code by language over the public, own, non-fork repositories, largest first */
  languages: { name: string, share: number }[]
  recent: { repo: string, what: string, at: string }[]
  post: { title: string, date: string, summary: string, path: string } | null
  builtAt: string
  /** made up: no GITHUB_TOKEN (dev), or GitHub could not be reached */
  sample: boolean
}

type Json = Record<string, any>

export async function collect(rootDir: string): Promise<ReadmeData> {
  const [profile, post] = await Promise.all([readProfile(rootDir), latestPost(rootDir)])
  const base = { profile, post, builtAt: new Date().toISOString() }
  try {
    if (!process.env.GITHUB_TOKEN) throw new Error('no GITHUB_TOKEN')
    const [users, recent] = await Promise.all([Promise.all(ACCOUNTS.map(user)), recentActivity()])
    return { ...base, ...combine(users), recent, sample: false }
  }
  catch (e) {
    console.warn(`[readme] using made-up GitHub numbers (${(e as Error).message})`)
    return { ...base, ...sample(), sample: true }
  }
}

// ---------- content ----------

async function readProfile(rootDir: string): Promise<ReadmeData['profile']> {
  const yml = await readFile(join(rootDir, 'content/en/profile.yml'), 'utf8')
  // flat "key: value" lines are all that is needed here
  const get = (k: string) => new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(yml)?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
  return { name: get('name'), fullName: get('fullName'), role: get('role'), location: get('location'), pitch: get('pitch'), email: get('email') }
}

async function latestPost(rootDir: string): Promise<ReadmeData['post']> {
  const dir = join(rootDir, 'content/en/posts')
  const posts = await Promise.all((await readdir(dir)).filter(f => f.endsWith('.md')).map(async (f) => {
    const { data } = parseFrontMatter(await readFile(join(dir, f), 'utf8'))
    return { title: String(data.title), date: String(data.date).slice(0, 10), summary: String(data.summary ?? ''), path: `/posts/${f.slice(0, -3)}`, draft: !!data.draft }
  }))
  const newest = posts.filter(p => !p.draft).sort((a, b) => b.date.localeCompare(a.date))[0]
  return newest ? { title: newest.title, date: newest.date, summary: newest.summary, path: newest.path } : null
}

// ---------- GitHub ----------

async function graphql(query: string, variables: Json) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'content-type': 'application/json', 'user-agent': 'integr.cc readme' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`)
  const body = await res.json() as Json
  if (body.errors?.length) throw new Error(body.errors[0].message)
  return body.data
}

const USER = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes { name stargazerCount languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
  }
}`

async function user(login: string) {
  return (await graphql(USER, { login })).user as Json
}

function combine(users: Json[]) {
  const perDay = new Map<string, number>()
  const bytes = new Map<string, number>()
  const totals = { contributions: 0, commits: 0, pullRequests: 0, issues: 0, stars: 0, repos: 0, followers: 0 }
  for (const u of users) {
    const cc = u.contributionsCollection
    for (const w of cc.contributionCalendar.weeks) {
      for (const d of w.contributionDays) perDay.set(d.date, (perDay.get(d.date) ?? 0) + d.contributionCount)
    }
    totals.contributions += cc.contributionCalendar.totalContributions
    totals.commits += cc.totalCommitContributions + cc.restrictedContributionsCount
    totals.pullRequests += u.pullRequests.totalCount
    totals.issues += u.issues.totalCount
    totals.followers += u.followers.totalCount
    const repos = (u.repositories.nodes as Json[]).filter(r => r.name !== '.github')
    totals.repos += repos.length
    for (const r of repos) {
      totals.stars += r.stargazerCount
      for (const e of r.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size)
    }
  }
  const days = [...perDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  return { days, totals, languages: shares(bytes) }
}

/** The six largest languages and the rest as "Other". */
function shares(bytes: Map<string, number>) {
  const sum = [...bytes.values()].reduce((a, b) => a + b, 0) || 1
  const sorted = [...bytes].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 6).map(([name, b]) => ({ name, share: b / sum }))
  const rest = sorted.slice(6).reduce((a, [, b]) => a + b, 0) / sum
  return rest > 0.005 ? [...top, { name: 'Other', share: rest }] : top
}

async function recentActivity(): Promise<ReadmeData['recent']> {
  const events = (await Promise.all(ACCOUNTS.map(async (a) => {
    const res = await fetch(`https://api.github.com/users/${a}/events/public?per_page=100`, {
      headers: { 'authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'accept': 'application/vnd.github+json', 'user-agent': 'integr.cc readme' },
    })
    if (!res.ok) throw new Error(`GitHub events ${res.status}`)
    return await res.json() as Json[]
  }))).flat().sort((a, b) => b.created_at.localeCompare(a.created_at))

  const out: ReadmeData['recent'] = []
  const seen = new Set<string>()
  for (const e of events) {
    const repo = e.repo.name as string
    if (QUIET.includes(repo)) continue
    const what = describe(e)
    // one line per repository and kind, the newest
    if (!what || seen.has(`${repo} ${e.type}`)) continue
    seen.add(`${repo} ${e.type}`)
    out.push({ repo, what, at: e.created_at })
    if (out.length === 4) break
  }
  return out
}

function describe(e: Json): string | null {
  switch (e.type) {
    case 'PushEvent': {
      const n = e.payload.size ?? e.payload.commits?.length ?? 1
      return `pushed ${n} commit${n === 1 ? '' : 's'}`
    }
    case 'ReleaseEvent': return e.payload.action === 'published' ? `released ${e.payload.release.tag_name}` : null
    case 'CreateEvent': return e.payload.ref_type === 'repository' ? 'created the repository' : e.payload.ref_type === 'tag' ? `tagged ${e.payload.ref}` : null
    case 'PullRequestEvent': return e.payload.action === 'opened' ? `opened PR #${e.payload.number}` : e.payload.pull_request?.merged ? `merged PR #${e.payload.number}` : null
    case 'IssuesEvent': return e.payload.action === 'opened' ? `opened issue #${e.payload.issue.number}` : null
    default: return null
  }
}

// ---------- without GitHub ----------

/** Plausible numbers to lay the images out with, the same on every run. */
function sample() {
  const rand = rng(11)
  const today = new Date()
  const days = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(today.getTime() - (364 - i) * 864e5)
    const busy = Math.sin(i / 23) > 0.2 ? 6 : 2
    return { date: d.toISOString().slice(0, 10), count: rand() < 0.35 ? 0 : Math.floor(rand() * busy * (d.getDay() % 6 ? 1.4 : 0.5)) }
  })
  const ago = (h: number) => new Date(today.getTime() - h * 36e5).toISOString()
  return {
    days,
    totals: { contributions: days.reduce((a, d) => a + d.count, 0), commits: 912, pullRequests: 48, issues: 31, stars: 214, repos: 27, followers: 40 },
    languages: [
      { name: 'Kotlin', share: 0.46 }, { name: 'TypeScript', share: 0.18 }, { name: 'Vue', share: 0.12 },
      { name: 'Java', share: 0.1 }, { name: 'Go', share: 0.06 }, { name: 'CSS', share: 0.04 }, { name: 'Other', share: 0.04 },
    ],
    recent: [
      { repo: 'integr-dev/osmium', what: 'pushed 3 commits', at: ago(5) },
      { repo: 'integr-dev/backbone', what: 'released v1.4.0', at: ago(30) },
      { repo: 'e-reitbauer/forkcast', what: 'pushed 7 commits', at: ago(52) },
      { repo: 'integr-dev/clay', what: 'opened PR #12', at: ago(80) },
    ],
  }
}
