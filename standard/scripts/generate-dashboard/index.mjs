#!/usr/bin/env node
// Renders a repository's work state as one static page: site/dashboard/index.html.
//
// Everything it shows is read from committed files - the backlog pool, the sprints, the
// changelog, the decision records, the specs. Two people who run it on the same commit get
// byte-identical output, so the page is a projection of the repo and never a second place
// where work is tracked. Sources that a repo does not have are skipped, not faked.
//
//   node scripts/generate-dashboard/index.mjs [repo-root] [--out <file>] [--watch] [--serve [port]]
//                                            [--anonymise]
//
// --watch rebuilds when a source file changes; --serve adds a local server so an open page
// notices and offers a refresh. Neither ever touches git: a page going stale is a display
// problem, and fixing it by moving somebody's branch would be a much worse one.
//
// --anonymise keeps names out of the structured fields: assignees, and the person a sprint
// names as its owner. It is not redaction - prose written by hand (an item's status note, a
// sprint's outcome, a changelog entry) is reproduced as written, so a build that must carry no
// names needs the sources checked too. The page never contains anything the repository does
// not already contain, which is the whole security model: a private repository's page is
// private data and belongs behind whatever gate the repository is behind.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, watch } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash, createCipheriv, pbkdf2Sync } from 'node:crypto'
import { createServer } from 'node:http'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const outFlag = argv.indexOf('--out')
const serveFlag = argv.indexOf('--serve')
// 9675 spells "work" on a phone keypad, and belongs to nothing: the ports a developer
// actually has in use - 3000, 4173, 5173, 5432, 8080, 9229 - are all somewhere else. A
// dashboard that squats on the port your app wants is a dashboard you turn off.
const DEFAULT_PORT = 9675
const port = serveFlag >= 0 && /^\d+$/.test(argv[serveFlag + 1] || '') ? Number(argv[serveFlag + 1]) : DEFAULT_PORT
const watching = argv.includes('--watch') || serveFlag >= 0
const anonymise = argv.includes('--anonymise') || argv.includes('--anonymize')
// The first bare argument is the repository root - unless it is a flag's value. Written as a
// set of taken positions because the obvious `n !== outFlag + 1` reads as position 0 when
// there is no --out at all, which silently swallowed the root of `index.mjs /path/to/repo`.
const taken = new Set()
if (outFlag >= 0) taken.add(outFlag + 1)
if (serveFlag >= 0 && /^\d+$/.test(argv[serveFlag + 1] || '')) taken.add(serveFlag + 1)
const root = resolve(argv.find((a, n) => !a.startsWith('--') && !taken.has(n)) || join(here, '..', '..'))

const read = (p) => readFileSync(join(root, p), 'utf8')
const has = (p) => existsSync(join(root, p))
const pick = (...paths) => paths.find(has) || null
const readIf = (p) => (p && has(p) ? read(p) : null)

/* ---------- markdown fragments -> inline html ---------- */

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Link targets are repo-relative paths that mean nothing to a reader on a web page,
// so the label survives and the target does not.
const inline = (s) =>
  esc(String(s ?? '').trim())
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')

const plain = (s) =>
  String(s ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const clip = (s, max = 260) => {
  const t = plain(s)
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '))
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : cut.trimEnd() + '…'
}

/* ---------- tables ---------- */

const cells = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

const isSeparator = (line) => /^\|[\s:|-]+\|$/.test(line.trim())
const key = (s) => s.toLowerCase().replace(/[^a-z]/g, '')

// A table is read by its header names, so a repo that ships more columns than another
// (cap, persona, assignee) is read correctly by the same code.
function readTable(lines, start) {
  const header = cells(lines[start]).map(key)
  const rows = []
  let i = start + 1
  if (isSeparator(lines[i] || '')) i++
  for (; i < lines.length && (lines[i] || '').trim().startsWith('|'); i++) {
    if (isSeparator(lines[i])) continue
    const c = cells(lines[i])
    if (!c[0]) continue
    const row = {}
    header.forEach((h, n) => (row[h] = c[n] ?? ''))
    rows.push(row)
  }
  return { rows, end: i }
}

function splitStatus(raw) {
  const s = String(raw ?? '').trim()
  const status = (s.match(/^(done|doing|todo|blocked|split)/) || [, 'todo'])[1]
  const blockedBy = (s.match(/^(?:blocked|split):([A-Za-z0-9-]+)/) || [])[1] || null
  const statusDate = (s.match(/\((?:moved )?(\d{4}-\d{2}-\d{2})/) || [])[1] || null
  const rest = s.replace(/^[a-z]+(:[A-Za-z0-9-]+)?(\s*\([^)]*\))?\s*-?\s*/, '')
  return { status, blockedBy, statusDate, statusNote: rest === s ? '' : inline(rest) }
}

// A persona is a role the product serves and stays; an assignee is a named colleague, and a
// page that leaves the building should not carry them. Removed here rather than hidden in the
// page, so the build genuinely does not contain them.
const person = (name) => (anonymise ? '' : name || '')

const asItem = (row, epic) => ({
  id: row.id,
  title: inline(row.title),
  why: inline(row.why),
  dod: inline(row.dod ?? row.definitionofdone ?? ''),
  cap: row.cap || '',
  persona: row.persona || '',
  owner: row.owner || '',
  assignee: person(row.assignee),
  size: row.size || '',
  epic: epic || '',
  ...splitStatus(row.status),
})

/* ---------- sections ---------- */

function sectionBody(text, heading) {
  const re = new RegExp('^#{2,3} ' + heading + '\\s*$', 'm')
  const start = text.search(re)
  if (start < 0) return ''
  const out = []
  for (const line of text.slice(start).split('\n').slice(1)) {
    if (/^#{2,3} /.test(line)) break
    if (!line.trim()) {
      if (out.length) break
      continue
    }
    if (line.trim().startsWith('<!--') || line.trim().startsWith('|')) continue
    out.push(line.trim())
  }
  return out.join(' ')
}

const metaRow = (text, label) =>
  (text.match(new RegExp('\\|\\s*\\*\\*' + label + '\\*\\*\\s*\\|\\s*([^|]+)\\|')) || [])[1]?.trim() || null

/* ---------- the work pool ---------- */

function parseBacklog() {
  const file = pick('backlog.md', 'docs/backlog.md')
  if (!file) return { epics: [], note: '', inFlight: [] }
  const lines = read(file).split('\n')
  const epics = []
  const inFlight = []
  let epic = null
  let note = []
  let mode = null

  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,3}) (.+)$/)
    if (h) {
      const title = h[2].trim()
      if (/^Epic:/.test(title)) {
        epic = { title: title.replace(/^Epic:\s*/, ''), blurb: '', items: [] }
        epics.push(epic)
        mode = 'epic'
      } else if (/^In flight/i.test(title)) {
        mode = 'inflight'
        epic = null
      } else if (/^Status|what's next/i.test(title)) {
        mode = 'note'
        epic = null
      } else {
        mode = null
        epic = null
      }
      continue
    }

    const line = lines[i]
    if (line.trim().startsWith('|')) {
      const t = readTable(lines, i)
      if (mode === 'epic' && epic) epic.items.push(...t.rows.filter((r) => r.id).map((r) => asItem(r, epic.title)))
      if (mode === 'inflight')
        inFlight.push(
          ...t.rows
            .filter((r) => r.team || r.sprint)
            .map((r) => ({ team: r.team, goal: inline(r.goal), target: plain(r.target), items: r.items })),
        )
      i = t.end - 1
      continue
    }

    if (mode === 'note' && line.trim()) note.push(line.trim())
    if (mode === 'epic' && epic && line.trim() && !line.startsWith('>') && !epic.items.length) {
      epic.blurb += (epic.blurb ? ' ' : '') + line.trim()
    }
  }

  return { epics, inFlight, note: inline(note.join(' ')) }
}

/* ---------- history ---------- */

function parseChangelog() {
  const file = pick('CHANGELOG.md', 'docs/CHANGELOG.md')
  if (!file) return { entries: [], releases: [] }
  const entries = []
  const releases = []
  let release = null
  let current = null

  const flush = () => {
    if (!current) return
    current.summary = clip(current.body.join(' '), 300)
    delete current.body
    entries.push(current)
    current = null
  }

  for (const line of read(file).split('\n')) {
    const rel = line.match(/^## \[?(Unreleased|\d+\.\d+\.\d+)\]?(?: - (\d{4}-\d{2}-\d{2}))?/)
    if (rel) {
      flush()
      release = rel[1]
      if (rel[1] !== 'Unreleased') releases.push({ version: rel[1], date: rel[2] || null, count: 0 })
      continue
    }
    const entry = line.match(/^### (.+?)\s*\((\d{4}-\d{2}-\d{2})\)\s*$/)
    if (entry) {
      flush()
      current = { title: inline(entry[1]), date: entry[2], release, body: [] }
      const r = releases.find((x) => x.version === release)
      if (r) r.count++
      continue
    }
    if (current && line.trim() && !line.startsWith('#')) current.body.push(line.trim())
  }
  flush()

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { entries, releases }
}

/* ---------- decisions, questions, ideas, specs ---------- */

// A repo keeps its records flat or split into adr/ and bdr/ - both shapes read the same,
// and a business decision is exactly the kind a non-technical reader came here for.
function parseDecisions() {
  const dir = 'docs/decision-records'
  if (!has(dir)) return []
  const files = []
  const walk = (rel, depth) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (e.isDirectory() && depth > 0) walk(join(rel, e.name), depth - 1)
      else if (/^[AB]DR-\d+.*\.md$/.test(e.name)) files.push(join(rel, e.name))
    }
  }
  walk(dir, 1)

  return files
    .map((f) => {
      const text = read(f)
      const h = text.match(/^# ([AB]DR-\d+):\s*(.+)$/m) || []
      const id = h[1] || basename(f, '.md')
      return {
        id,
        kind: id.startsWith('BDR') ? 'business' : 'technical',
        title: inline(h[2] || basename(f, '.md')),
        status: metaRow(text, 'Status') || 'Accepted',
        date: metaRow(text, 'Date'),
        context: clip(sectionBody(text, 'Context'), 340),
      }
    })
    .sort((a, b) => (a.id < b.id ? 1 : -1))
}

function parseQuestions() {
  const file = 'docs/open-questions/README.md'
  if (!has(file)) return []
  const lines = read(file).split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) continue
    const t = readTable(lines, i)
    for (const r of t.rows) {
      if (!r.topic) continue
      out.push({
        topic: inline(r.topic),
        decided: inline(r.decided),
        doubt: inline(r.thedoubtinoneline ?? r.doubt ?? ''),
        open: /\bopen\b|not decided/i.test(plain(r.decided)),
      })
    }
    i = t.end - 1
  }
  return out
}

function parseIdeas() {
  const dir = 'docs/ideas'
  if (!has(dir)) return []
  return readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'))
    .map((f) => {
      const text = read(join(dir, f))
      return {
        title: inline((text.match(/^# (.+)$/m) || [, f])[1]),
        status: metaRow(text, 'Status') || 'idea',
        date: metaRow(text, 'Date'),
        itch: clip(sectionBody(text, 'The itch') || sectionBody(text, 'Context'), 340),
      }
    })
}

function parseSpecs() {
  if (!has('specs')) return []
  return readdirSync(join(root, 'specs'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, 'specs', d.name, 'spec.md')))
    .map((d) => {
      const text = read(join('specs', d.name, 'spec.md'))
      return {
        name: d.name,
        title: inline((text.match(/^# (.+)$/m) || [, d.name])[1]),
        status: (text.match(/^\*\*Status:\*\*\s*(.+)$/m) || [, 'unknown'])[1].trim(),
        tier: (text.match(/^\*\*Spec tier:\*\*\s*(.+)$/m) || [, ''])[1].trim(),
        serves: clip((text.match(/^\*\*Serves:\*\*\s*(.+)$/m) || [, ''])[1], 200),
        purpose: clip(sectionBody(text, 'Purpose'), 300),
      }
    })
}

/* ---------- sprints: the sprint view ---------- */

function parseSprints() {
  const dir = 'docs/sprints'
  if (!has(dir)) return []
  const out = []
  for (const team of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (!team.isDirectory()) continue
    for (const f of readdirSync(join(root, dir, team.name))) {
      if (!f.endsWith('.md') || f.startsWith('_') || f === 'README.md') continue
      const text = read(join(dir, team.name, f))
      const lines = text.split('\n')
      const items = []
      let inItems = false
      for (let i = 0; i < lines.length; i++) {
        if (/^## /.test(lines[i])) inItems = /Intents/i.test(lines[i])
        if (!inItems || !lines[i].trim().startsWith('|')) continue
        const t = readTable(lines, i)
        items.push(...t.rows.filter((r) => r.id).map((r) => asItem(r, '')))
        i = t.end - 1
      }
      const outcome = sectionBody(text, 'Outcome')
      out.push({
        team: team.name,
        slug: basename(f, '.md'),
        goal: inline(metaRow(text, 'Goal') || ''),
        owner: person(metaRow(text, 'Owner')),
        opened: metaRow(text, 'Opened'),
        target: metaRow(text, 'Target'),
        state: (metaRow(text, 'Status') || 'open').toLowerCase().trim(),
        outcome: inline(outcome),
        stats: outcomeStats(outcome),
        items,
      })
    }
  }
  return out.sort((a, b) => (a.slug < b.slug ? 1 : -1))
}

// /sprint-close writes one aggregate sentence per sprint. It is the only record of what a team
// believed it would finish, so the report reads those numbers rather than recounting rows.
function outcomeStats(text) {
  const t = plain(text)
  const n = (re) => {
    const m = t.match(re)
    return m ? Number(m[1]) : null
  }
  const stats = {
    planned: n(/Planned (\d+)/i),
    finished: n(/finished (\d+)/i),
    returned: n(/returned to the pool (\d+)/i),
    unplanned: n(/[Uu]nplanned work absorbed:?\s*(\d+)/),
    commits: n(/Commits in the window:?\s*(\d+)/i),
    days: n(/Days elapsed:?\s*(\d+)/i),
  }
  return stats.planned === null && stats.finished === null ? null : stats
}

// The projection the repo already writes for itself - read, never recomputed here.
function parseTimeline() {
  const file = 'docs/sprints/TIMELINE.md'
  if (!has(file)) return null
  const text = read(file)
  const lines = text.split('\n')
  const stands = []
  const evidence = []
  let section = null
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^## (.+)$/)
    if (h) section = key(h[1])
    if (!lines[i].trim().startsWith('|')) continue
    const t = readTable(lines, i)
    if (section === 'wherethingsstand') {
      stands.push(
        ...t.rows.map((r) => ({
          team: r.team,
          sprint: plain(r.sprint),
          goal: inline(r.goal),
          target: plain(r.target),
          remaining: plain(r.remaining),
          projected: inline(r.projected),
          verdict: inline(r.vstarget),
        })),
      )
    } else if (section === 'evidence') {
      evidence.push(
        ...t.rows.map((r) => ({
          sprint: plain(r.sprint),
          days: r.days,
          finished: r.finished,
          unplanned: r.unplanned,
          throughput: plain(r.throughput),
        })),
      )
    }
    i = t.end - 1
  }
  return {
    generated: (text.match(/Generated (\d{4}-\d{2}-\d{2})/) || [])[1] || null,
    headline: inline(sectionBody(text, 'The line that matters')),
    stands,
    evidence,
  }
}

/* ---------- assemble ---------- */

const git = (...args) => {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function collect() {
const backlog = parseBacklog()
const { entries, releases } = parseChangelog()
const sprints = parseSprints()
const items = backlog.epics.flatMap((e) => e.items)

const pkg = has('package.json') ? JSON.parse(read('package.json')) : {}
const version = (readIf('VERSION') || pkg.version || '').trim() || null
const specDoc = readIf(pick('standard/SPEC.md', 'SPEC.md')) || ''
const skillDir = pick('standard/.claude/skills', '.claude/skills')

const commit = git('rev-parse', '--short', 'HEAD')
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
// A worktree directory is named for the branch it holds, so the remote names the repo - with
// its owner, because a repo called `core` says nothing on its own.
const remote = (git('config', '--get', 'remote.origin.url') || '').replace(/\.git$/, '')
const slug = remote.split(/[:/]/).slice(-2)
const repoName = remote ? (slug[0] && slug[0] !== slug[1] ? slug.join('/') : slug[1]) : null

// One way out of the page, to wherever this project actually lives. Declared by the repo -
// its homepage, the domain its site is published under, or failing both the repository
// itself. A status page does not need to explain the product; it needs to link to it.
const cname = (readIf('site/CNAME') || readIf('CNAME') || '').trim().split('\n')[0]
const home =
  (typeof pkg.homepage === 'string' && pkg.homepage.trim()) ||
  (cname && `https://${cname}`) ||
  (remote.startsWith('git@github.com:') ? `https://github.com/${remote.slice('git@github.com:'.length)}` : null) ||
  (remote.startsWith('https://') ? remote : null)

const data = {
  meta: {
    name: pkg.name || repoName || basename(root),
    home,
    version,
    commit,
    branch,
    latest: entries[0]?.date || null,
    rules: (specDoc.match(/^- \*\*R\d+\.\*\*/gm) || []).length,
    skills: skillDir
      ? readdirSync(join(root, skillDir), { withFileTypes: true }).filter((d) =>
          existsSync(join(root, skillDir, d.name, 'SKILL.md')),
        ).length
      : 0,
  },
  backlog,
  items,
  sprints,
  timeline: parseTimeline(),
  entries,
  releases,
  decisions: parseDecisions(),
  questions: parseQuestions(),
  ideas: parseIdeas(),
  specs: parseSpecs(),
}

const inCycles = sprints.filter((c) => c.state === 'open').flatMap((c) => c.items)
data.counts = {
  todo: items.filter((i) => i.status === 'todo').length,
  doing: items.filter((i) => i.status === 'doing').length,
  blocked: items.filter((i) => i.status === 'blocked').length,
  done: items.filter((i) => i.status === 'done').length,
  sprintOpen: sprints.filter((c) => c.state === 'open').length,
  sprintItems: inCycles.length,
  sprintDone: inCycles.filter((i) => i.status === 'done').length,
  unreleased: entries.filter((e) => e.release === 'Unreleased').length,
  openQuestions: data.questions.filter((q) => q.open).length,
}

return data
}

/* ---------- one password, no server ---------- */

// `--lock` encrypts the page and ships the ciphertext. What is hosted is unreadable without
// the passphrase, so a host with no authentication of its own - GitHub Pages, an S3 bucket,
// anything static - carries it safely. AES-256-GCM, key stretched with PBKDF2-SHA-256 at
// 600,000 iterations, decrypted in the browser by WebCrypto.
//
// What it is: a real lock. The bytes on the host are ciphertext; a wrong password fails the
// GCM tag and yields nothing. What it is not: per-person access. One shared secret, revoked
// by changing it and rebuilding, and an attacker can take the ciphertext away and try
// passwords offline - so use a passphrase worth attacking, not the company name and a year.
const PBKDF2_ROUNDS = 600_000
const password = process.env.DASHBOARD_PASSWORD || ''
const locked = argv.includes('--lock')
if (locked && password.length < 8) {
  console.error('dashboard: --lock needs DASHBOARD_PASSWORD set to at least 8 characters')
  console.error('  (an environment variable, never an argument - arguments reach shell history and CI logs)')
  process.exit(1)
}

function lock(html, data) {
  // Salt and nonce are derived from the plaintext, so the same content encrypts to the same
  // bytes and the build stays reproducible. Different content gives a different nonce, which
  // is the property AES-GCM actually needs; identical content giving identical ciphertext is
  // what "deterministic" means here, and this page's fingerprint is not a secret anyway.
  const digest = (label) => createHash('sha256').update(label + data.meta.fingerprint).digest()
  const salt = digest('work-dashboard/salt').subarray(0, 16)
  const iv = digest('work-dashboard/iv').subarray(0, 12)
  const key = pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 32, 'sha256')

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([cipher.update(html, 'utf8'), cipher.final(), cipher.getAuthTag()])

  const gate = readFileSync(join(here, 'src', 'gate.js'), 'utf8')
    .replace('__SALT__', salt.toString('base64'))
    .replace('__IV__', iv.toString('base64'))
    .replace('__ROUNDS__', String(PBKDF2_ROUNDS))

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Dashboard</title>
<style>
${readFileSync(join(here, 'src', 'gate.css'), 'utf8')}</style>
</head>
<body>
<form id="gate" autocomplete="on">
  <!-- The repository is not named until the password names it. A locked page that announces
       whose backlog it is has given away the one thing the reader's employer may care about. -->
  <h1>Dashboard <span>- locked</span></h1>
  <p>This page is encrypted. Enter the password you were given.</p>
  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" autofocus>
  <button type="submit">Open</button>
  <p id="err" role="alert" hidden>That password does not open this page.</p>
</form>
<script type="application/octet-stream" id="payload">${body.toString('base64')}</script>
<script>
${gate}</script>
</body>
</html>
`
}

/* ---------- emit ---------- */

const out = outFlag >= 0 ? resolve(argv[outFlag + 1]) : join(root, 'site/dashboard/index.html')
const stateFile = join(dirname(out), 'state.json')

function build() {
  const data = collect()

  // Pointed at the wrong directory, every parser finds nothing and the page renders as an
  // empty but entirely convincing dashboard. Thrown rather than exited: under --watch this
  // is one bad rebuild, and killing a running server over it would be the larger surprise.
  if (!data.items.length && !data.sprints.length && !data.entries.length && !data.decisions.length && !data.specs.length) {
    throw new Error(
      `found no backlog, sprints, changelog, decision records or specs under ${root}\n` +
        '  pass the repository root as the first argument if it is not the parent of this script',
    )
  }
  // The fingerprint is of the content, not of the moment - so the page stays byte-identical
  // for a given commit, and an open page can still tell that the content moved.
  const payload = JSON.stringify(data)
  data.meta.fingerprint = createHash('sha256').update(payload).digest('hex').slice(0, 12)

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Dashboard - ${esc(data.meta.name)}</title>
<style>
${readFileSync(join(here, 'src', 'page.css'), 'utf8')}</style>
</head>
<body>
<script type="application/json" id="work-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>
${readFileSync(join(here, 'src', 'page.js'), 'utf8')}</script>
</body>
</html>
`

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, locked ? lock(html, data) : html)
  // Read by the open page every couple of minutes: same commit, same fingerprint, no nag.
  // A locked build says only that the content moved - the commit and the branch are two more
  // facts about a repository somebody has not opened yet, and this file is not encrypted.
  writeFileSync(
    stateFile,
    JSON.stringify(
      locked
        ? { fingerprint: data.meta.fingerprint, built: new Date().toISOString() }
        : { fingerprint: data.meta.fingerprint, commit: data.meta.commit, branch: data.meta.branch, built: new Date().toISOString() },
      null,
      2,
    ),
  )

  console.log(
    `dashboard: ${data.items.length} pool items, ${data.sprints.length} sprints (${data.counts.sprintItems} items), ` +
      `${data.entries.length} changelog entries, ${data.decisions.length} decisions, ${data.specs.length} specs -> ${out}`,
  )
  return data
}

// The first build decides whether there is anything to serve at all, so its failure is the
// process's. A later one has a page already on disk and a reader looking at it.
try {
  build()
} catch (err) {
  console.error(`dashboard: ${err.message}`)
  process.exit(1)
}

/* ---------- watch + serve: a page that notices it went stale ---------- */

if (watching) {
  const sources = ['backlog.md', 'docs/backlog.md', 'CHANGELOG.md', 'docs/CHANGELOG.md', 'PRODUCT.md', 'docs/PRODUCT.md']
    .filter(has)
    .concat(['docs/sprints', 'docs/decision-records', 'docs/ideas', 'docs/open-questions', 'specs'].filter(has))

  let pending = null
  for (const src of sources) {
    watch(join(root, src), { recursive: true }, () => {
      clearTimeout(pending)
      pending = setTimeout(() => {
        try {
          build()
        } catch (err) {
          console.error('dashboard: rebuild failed -', err.message)
        }
      }, 250)
    })
  }
  console.log(`dashboard: watching ${sources.length} sources`)
}

if (serveFlag >= 0) {
  const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' }
  const server = createServer((req, res) => {
    const name = (req.url || '/').split('?')[0] === '/state.json' ? stateFile : out
    try {
      const body = readFileSync(name)
      res.writeHead(200, { 'content-type': types[name.endsWith('.json') ? '.json' : '.html'], 'cache-control': 'no-store' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not built yet')
    }
  })

  // A port already in use is the one failure here that is entirely ordinary - two checkouts,
  // or the last run still open. Say which port and how to pick another, not a stack trace.
  server.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err
    console.error(`dashboard: port ${port} is already in use - pass another, e.g. --serve ${port + 1}`)
    process.exit(1)
  })

  // Loopback only. The page carries whatever the repository carries, and a dev server that
  // binds every interface serves a private backlog to the coffee shop.
  server.listen(port, '127.0.0.1', () => console.log(`dashboard: http://localhost:${port} (live)`))
}
