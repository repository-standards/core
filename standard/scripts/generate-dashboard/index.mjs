#!/usr/bin/env node
// Renders a repository's work state as one static page: _dashboard/index.html.
//
// Everything it shows is read from committed files - the backlog pool, the sprints, the
// changelog, the decision records, the specs. Two people who run it on the same commit get
// byte-identical output, so the page is a projection of the repo and never a second place
// where work is tracked. Sources that a repo does not have are skipped, not faked.
//
//   node scripts/generate-dashboard/index.mjs [repo-root] [--out <file>] [--watch] [--serve [port]]
//                                            [--anonymise] [--with-discovery] [--registry <path>]
//
// --watch rebuilds when a source file changes; --serve adds a local server so an open page
// notices and offers a refresh. Neither ever touches git: a page going stale is a display
// problem, and fixing it by moving somebody's branch would be a much worse one.
//
// --registry points at a stack registry (this repo's own stacks.json shape: {"stacks":
// [{"technology","repo",...}]}) this build is one surface of, and turns on a switcher between
// this dashboard and every other one the registry names - the dashboard's counterpart to the
// core_url/node_url switcher tools/docsite.mjs already renders for landing and docs. Only the
// core's own pages.yml passes it today; a standalone run (a stack's own dashboard.yml, or
// anyone running this by hand) omits it and renders no switcher.
//
// --anonymise keeps names out of the structured fields: assignees, and the person a sprint
// names as its owner. It is not redaction - prose written by hand (an item's status note, a
// sprint's outcome, a changelog entry) is reproduced as written, so a build that must carry no
// names needs the sources checked too. The page never contains anything the repository does
// not already contain, which is the whole security model: a private repository's page is
// private data and belongs behind whatever gate the repository is behind.
//
// --with-discovery additionally carries the BODIES of the discovery dossiers into the page.
// Off by default, and deliberately: a dossier is the one folder holding raw material about
// named people - who said what at which meeting, quoted from a client's mail - and this page
// is built by a workflow that publishes it. Titles, stamps and counts ship either way, since
// those are the state; the material itself only ships when somebody asks for it in the
// command that builds the page. --anonymise turns it back off whatever the flags say.

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
const registryFlag = argv.indexOf('--registry')
// 9675 spells "work" on a phone keypad, and belongs to nothing: the ports a developer
// actually has in use - 3000, 4173, 5173, 5432, 8080, 9229 - are all somewhere else. A
// dashboard that squats on the port your app wants is a dashboard you turn off.
const DEFAULT_PORT = 9675
const port = serveFlag >= 0 && /^\d+$/.test(argv[serveFlag + 1] || '') ? Number(argv[serveFlag + 1]) : DEFAULT_PORT
const watching = argv.includes('--watch') || serveFlag >= 0
const anonymise = argv.includes('--anonymise') || argv.includes('--anonymize')
// Anonymising and shipping the meeting extracts are opposites, so the two flags together
// resolve to the safer one rather than to the last one typed.
const withDiscovery = argv.includes('--with-discovery') && !anonymise
// The first bare argument is the repository root - unless it is a flag's value. Written as a
// set of taken positions because the obvious `n !== outFlag + 1` reads as position 0 when
// there is no --out at all, which silently swallowed the root of `index.mjs /path/to/repo`.
const taken = new Set()
if (outFlag >= 0) taken.add(outFlag + 1)
if (serveFlag >= 0 && /^\d+$/.test(argv[serveFlag + 1] || '')) taken.add(serveFlag + 1)
if (registryFlag >= 0) taken.add(registryFlag + 1)
const root = resolve(argv.find((a, n) => !a.startsWith('--') && !taken.has(n)) || join(here, '..', '..'))
// --registry points at the stack registry (stacks.json) this build is one surface of. Only
// the core's own pages.yml passes it - it is what turns "several dashboards" into "one
// ecosystem with a switcher", the same way core_url/node_url do for tools/docsite.mjs. A
// standalone run (a stack's own dashboard.yml, or anyone running this by hand) omits it and
// gets no switcher: outside that one aggregate deployment, the other dashboard's URL is not
// a real same-origin link.
const registryPath = registryFlag >= 0 ? resolve(argv[registryFlag + 1] || '') : null

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

// A field whose whole value is a state - a row's status cell, a record's Status row, a spec's
// Status line - is written by hand and by hand it carries emphasis: `**done**`, `*live*`,
// `` `todo` ``. Emphasis is presentation, so it comes off before the value is read; the span's
// content and whatever follows it are handed back separately, because where the emphasis ended
// is the only honest boundary between the state somebody declared and the prose about it.
const EMPHASIS = /^(\*\*|__|\*|_|`)([\s\S]*?)\1\s*/
function unwrap(raw) {
  const s = String(raw ?? '').trim()
  const m = s.match(EMPHASIS)
  return m ? { lead: m[2].trim(), tail: s.slice(m[0].length) } : { lead: s, tail: '' }
}
// Rejoining is not concatenation with a space: the closing marker is routinely followed by the
// punctuation that carries the sentence on - `**done**: 22/22` - and a space in front of it
// reads as a typo the source file does not contain.
const rejoin = (a, b) => (!b ? a : !a ? b : /^[\s:.,;)!?-]/.test(b) ? a + b : a + ' ' + b)
const unemphasise = (s) => {
  const { lead, tail } = unwrap(s)
  return rejoin(lead, tail)
}

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

/* ---------- markdown documents -> html ---------- */

// A page that shows a spec's title and hides its requirements is a table of contents. The
// documents themselves are rendered here, at build time, so the payload stays inert data and
// no markdown parser ever ships to the browser - the page keeps its one job, which is to
// display what this file already decided.
//
// Link targets are dropped exactly as inline() drops them: they are repo-relative paths that
// resolve to nothing on a page served from somewhere else, so the label survives and the
// target does not. Everything a spec actually uses is kept - headings, lists, tables, code,
// quotes - and anything else degrades to a paragraph rather than to markup on the screen.
function mdHtml(md) {
  const lines = String(md ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
  const out = []
  let para = []
  const flush = () => {
    if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>')
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()

    if (t.startsWith('```')) {
      flush()
      const code = []
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i])
      out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>')
      continue
    }

    // An HTML comment in a source document is a note to whoever edits the file - the
    // template's own instructions, most often - and is not addressed to a reader.
    if (t.startsWith('<!--')) {
      flush()
      while (i < lines.length && !lines[i].includes('-->')) i++
      continue
    }

    if (!t) {
      flush()
      continue
    }

    const h = t.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flush()
      // The caller supplies the section heading; anything deeper renders two levels down so a
      // document displayed inside a panel never competes with the page's own headings.
      const level = Math.min(6, h[1].length + 2)
      out.push('<h' + level + '>' + inline(h[2]) + '</h' + level + '>')
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flush()
      out.push('<hr>')
      continue
    }

    if (t.startsWith('|')) {
      flush()
      const rows = []
      let j = i
      for (; j < lines.length && lines[j].trim().startsWith('|'); j++) {
        if (!isSeparator(lines[j])) rows.push(cells(lines[j]))
      }
      const head = rows.shift() || []
      // The spec template opens with a two-column table whose header cells are empty - a
      // layout device, not a header row. Rendering an empty <thead> puts a bar of nothing
      // above it, so a header with no text at all is dropped and the rows stand alone.
      const headed = head.some((c) => c)
      out.push(
        '<table>' +
          (headed ? '<thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>' : '') +
          '<tbody>' +
          (headed ? '' : '<tr>' + head.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>') +
          rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') +
          '</tbody></table>',
      )
      i = j - 1
      continue
    }

    if (t.startsWith('>')) {
      flush()
      const quote = []
      let j = i
      for (; j < lines.length && lines[j].trim().startsWith('>'); j++) quote.push(lines[j].trim().replace(/^>\s?/, ''))
      out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>')
      i = j - 1
      continue
    }

    const bullet = t.match(/^([-*+]|\d+\.)\s+(.*)$/)
    if (bullet) {
      flush()
      const ordered = /\d/.test(bullet[1])
      const items = []
      let j = i
      for (; j < lines.length; j++) {
        const lt = lines[j].trim()
        const m = lt.match(/^([-*+]|\d+\.)\s+(.*)$/)
        if (m) {
          items.push(m[2])
          continue
        }
        // A wrapped line under an item belongs to that item; a blank line ends the list. Both
        // shapes are everywhere in these documents, where a requirement runs three lines.
        if (lt && /^\s/.test(lines[j]) && items.length) {
          items[items.length - 1] += ' ' + lt
          continue
        }
        break
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push('<' + tag + '>' + items.map((x) => '<li>' + inline(x) + '</li>').join('') + '</' + tag + '>')
      i = j - 1
      continue
    }

    para.push(t)
  }
  flush()
  return out.join('\n')
}

// A document's own `##` headings are its sections. Everything above the first one is the
// preamble - the title, the meta table, the status fields - which the card already carries,
// so it is not repeated here.
function splitSections(text) {
  const out = []
  let current = null
  let fenced = false
  for (const line of String(text ?? '').split('\n')) {
    // A `##` inside a fenced block is a shell comment or a heading being quoted, not this
    // document's own structure - splitting on it invents a section out of somebody's example.
    if (line.trim().startsWith('```')) fenced = !fenced
    const h = fenced ? null : line.match(/^##\s+(.+?)\s*$/)
    if (h) {
      current = { heading: plain(h[1]), lines: [] }
      out.push(current)
      continue
    }
    if (current) current.lines.push(line)
  }
  return out.map((s) => [s.heading, mdHtml(s.lines.join('\n'))]).filter((s) => s[1])
}

// The open-marker family (standard ADR-024) is a spec's own gap list, typed by what is missing:
// a question, a decision, an input, an asset - each naming who owes it. The clarify gate
// counts them to decide whether a spec is ready to develop. Counting them here is what lets
// the page say which specs are blocked and on whom, which today needs the gate run by hand,
// once per spec, by somebody who already suspected the answer.
function markersIn(text) {
  return [...String(text ?? '').matchAll(/\[NEEDS ([A-Z]+):?([^\]]*)\]/g)].map((m) => ({
    type: m[1].toLowerCase(),
    note: clip(m[2], 180),
  }))
}

// task/bug run todo|doing|blocked|done; open-question and idea rows carry their own
// vocabulary (standard ADR-046) and are matched here too, so an unrecognised word never silently
// becomes "todo" - it would corrupt counts that assume the task vocabulary.
const STATUS_WORDS = 'done|doing|todo|blocked|split|open|decided|idea|exploring|approved|parked|dropped|graduated'
const STATUS_RE = new RegExp('\\b(' + STATUS_WORDS + ')\\b', 'gi')
// `partly done` is not done. Counting it finished is the same lie as counting it not started,
// only pointed the other way, and the row itself says work remains - so it lands in `doing`,
// the one bucket that is true of work opened and not closed. The qualifier has to sit against
// the word: a row reading "done, and the crop premise was half wrong" is finished, and a rule
// that went looking for "half" anywhere in the lead would demote it on a sentence about
// something else entirely.
const PARTLY = /\b(partly|partially|mostly|half|nearly|almost)[\s-]+done\b/i
// Where the state stops and the prose about it starts, for a cell that carries no emphasis to
// mark the boundary itself. `blocked:ID (date)` stays inside the lead, because both are part
// of the state rather than commentary on it.
const LEAD_END = /:\s|\s-\s|\.\s|\.$/

// The state is the cell's first clause: the emphasis span when the writer marked one, else the
// text before the first colon, dash or full stop. Bounded on purpose - the rest of a status
// cell is prose, and prose says "Decided:", "TEST-1 is done", "blocked on nothing". A search
// over the whole cell would let a sentence about the work overrule the word stating its state.
function statusLead(raw) {
  const { lead, tail } = unwrap(raw)
  if (tail) return [lead, tail]
  const cut = lead.search(LEAD_END)
  return cut < 0 ? [lead, ''] : [lead.slice(0, cut), lead.slice(cut)]
}

// The match reads that lead rather than anchoring on the cell's first character. Anchoring is
// what made this the worst kind of wrong: every hand-written `**done**: ...` failed to match,
// fell through to the `todo` default, and rendered a finished pool as a pool nobody had
// started - a page that is confidently incorrect and looks entirely fine. On the repo this was
// found on, 16 of 17 rows were reported as not started while the file said otherwise.
function splitStatus(raw) {
  const [lead, tail] = statusLead(raw)
  // A cell that names two states is written state first, commentary after - so the FIRST word
  // wins. This repo's own backlog is what settles it, in both directions at once: `doing (site
  // confirmed live 2026-08-09; listings submission still todo)` is doing, and `todo (downgraded
  // from doing 2026-08-09, pending owner confirmation)` is todo. A last-word rule reads both
  // backwards, and they are the only two-state rows there are. `unblocked, todo` needs no
  // special case either way - `\b` is what stops `unblocked` being read as `blocked`, which
  // leaves `todo` the only state the lead names.
  const named = lead.match(STATUS_RE)
  let status = named ? named[0].toLowerCase() : 'todo'
  if (status === 'done' && PARTLY.test(lead)) status = 'doing'
  const blockedBy = (lead.match(/\b(?:blocked|split):([A-Za-z0-9-]+)/) || [])[1] || null
  const date = (s) => (String(s).match(/\((?:moved )?(\d{4}-\d{2}-\d{2})/) || [])[1] || null
  // A lead that carries only the state has nothing left to say, so it is dropped from the note
  // the way it always was. One that carries more - `partly done, one real gap found` - keeps
  // every word, because removing the state word from the middle of a phrase leaves a seam and
  // loses the qualifier that explains the badge.
  const bare = new RegExp('^(' + STATUS_WORDS + ')(:[A-Za-z0-9-]+)?(\\s*\\([^)]*\\))?$', 'i').test(lead)
  const note = (bare ? tail.replace(/^[\s:.,;-]+/, '') : rejoin(lead, tail)).trim()
  return { status, blockedBy, statusDate: date(lead) || date(tail), statusNote: note ? inline(note) : '' }
}

// A persona is a role the product serves and stays; an assignee is a named colleague, and a
// page that leaves the building should not carry them. Removed here rather than hidden in the
// page, so the build genuinely does not contain them.
const person = (name) => (anonymise ? '' : name || '')

// `inline()` renders a markdown link down to its label, so the path a row cites is gone by the
// time that row is shaped into an item. An idea row citing `docs/ideas/<slug>.md` IS that
// file's row, and the merge further down needs the slug to know it - so it is read here, off
// the raw cell, before the shaping that discards it. Spread rather than assigned, so a row
// citing nothing carries no key: an empty array on every row is payload the page never reads.
const IDEA_LINK = /docs\/ideas\/([\w.-]+)\.md/g
const ideaRefsOf = (row) => {
  const refs = [
    ...`${row.title ?? ''} ${row.why ?? ''} ${row.dod ?? row.definitionofdone ?? ''}`.matchAll(IDEA_LINK),
  ].map((m) => m[1])
  return refs.length ? { ideaRefs: refs } : {}
}

const asItem = (row, epic) => ({
  id: row.id,
  ...ideaRefsOf(row),
  type: row.type || 'task',
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

// The discovery template writes its summary as an inline bold label - `**Summary.** text` -
// not a heading, so sectionBody() never matches it. This reads that paragraph the same way
// sectionBody reads a heading's: from the label to the next blank line.
function boldParagraph(text, label) {
  const re = new RegExp('^\\*\\*' + label + '\\.?\\*\\*\\s*(.*)$', 'm')
  const m = text.match(re)
  if (!m) return ''
  const out = m[1] ? [m[1].trim()] : []
  for (const line of text.slice(m.index).split('\n').slice(1)) {
    if (!line.trim()) break
    out.push(line.trim())
  }
  return out.join(' ').trim()
}

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
        status: unemphasise(metaRow(text, 'Status') || 'Accepted'),
        date: metaRow(text, 'Date'),
        context: clip(sectionBody(text, 'Context'), 340),
        path: f,
        sections: splitSections(text),
      }
    })
    .sort((a, b) => (a.id < b.id ? 1 : -1))
}

// Reads the older shape: a table in docs/open-questions/README.md, topic per row. A repo
// that migrated its open questions into backlog.md (standard ADR-046) has no such table any more -
// those rows are picked up instead in collect(), from backlog items of type open-question.
// Both sources are additive, so a repo could in principle carry either or both.
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

// Reads one file per idea under docs/ideas/ - unaffected by whether that folder's README
// still carries a table, since it walks the directory rather than parsing the index page.
// A repo that also tracks ideas as backlog rows (standard ADR-046) gets those merged in collect().
function parseIdeas() {
  const dir = 'docs/ideas'
  if (!has(dir)) return []
  return readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'))
    .map((f) => {
      const text = read(join(dir, f))
      return {
        title: inline((text.match(/^# (.+)$/m) || [, f])[1]),
        // page.js renders this one straight into a class attribute, so `**exploring**` costs
        // more than looks: an invalid class token, and the asterisks on screen.
        status: unemphasise(metaRow(text, 'Status') || 'idea'),
        date: metaRow(text, 'Date'),
        itch: clip(sectionBody(text, 'The itch') || sectionBody(text, 'Context'), 340),
        path: join(dir, f),
        sections: splitSections(text),
        // An idea says which dossier it grew out of, when it grew out of one. Declared by the
        // file rather than guessed, with the folder mention as a fallback for a repo whose
        // ideas predate the field: a link that has to be inferred is a link that goes wrong
        // quietly, so the inferred one is only ever used when nothing was declared.
        discovery:
          (metaRow(text, 'Discovery') || '').match(/docs\/discovery\/([a-z0-9-]+)/i)?.[1] ||
          text.match(/docs\/discovery\/([a-z0-9-]+)/i)?.[1] ||
          null,
      }
    })
}

function parseSpecs() {
  if (!has('specs')) return []
  return readdirSync(join(root, 'specs'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, 'specs', d.name, 'spec.md')))
    .map((d) => {
      const path = join('specs', d.name, 'spec.md')
      const text = read(path)
      return {
        name: d.name,
        title: inline((text.match(/^# (.+)$/m) || [, d.name])[1]),
        // page.js maps the status onto a colour through a table keyed by the bare word, and
        // prints the tier as written - so `**live**` would both miss the table and render its
        // asterisks. Same reason as the pool's status cells: emphasis is not part of the value.
        status: unemphasise((text.match(/^\*\*Status:\*\*\s*(.+)$/m) || [, 'unknown'])[1]),
        tier: unemphasise((text.match(/^\*\*Spec tier:\*\*\s*(.+)$/m) || [, ''])[1]),
        serves: clip((text.match(/^\*\*Serves:\*\*\s*(.+)$/m) || [, ''])[1], 200),
        metric: clip((text.match(/^\*\*Success metric:\*\*\s*(.+)$/m) || [, ''])[1], 200),
        purpose: clip(sectionBody(text, 'Purpose'), 300),
        path,
        markers: markersIn(text),
        reconciled: (text.match(/Last reconciled:\*{0,2}\s*`?(\d{4}-\d{2}-\d{2})/) || [])[1] || null,
        sections: splitSections(text),
      }
    })
}

/* ---------- discovery dossiers ---------- */

// The inbox of a topic (standard ADR-024): the meetings and mails a spec will eventually be written
// from, each entry stamped with where it came from. A dossier is never normative, so the page
// shows it as material and never as something to act on.
//
// What it does put in front of a reader is the one thing nothing else here shows: a dossier
// whose entries are newer than its `Last reconciled:` stamp, or which holds a contradiction
// nobody has settled, is live work. Today that lives in a table inside a folder that no index
// reads, which is the same failure the dossier exists to prevent, one level up.
// An entry opens with the shipped template's instruction comment and a typed header table
// (standard ADR-049), and neither is addressed to a reader: taking the first 220 characters of the file
// verbatim summarises an entry as "Copy to docs/discovery/<topic>/...". What a reader would
// actually read is the prose under the headings, so that is what gets clipped.
const entryProse = (body) =>
  body
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((line) => !/^\s*[#|]/.test(line))
    .join('\n')

function parseDiscovery() {
  const dir = 'docs/discovery'
  if (!has(dir)) return []
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, dir, d.name, 'README.md')))
    .map((d) => {
      const base = join(dir, d.name)
      const text = read(join(base, 'README.md'))
      const stamp = plain((text.match(/\*\*Last reconciled:\*\*\s*(.+)$/m) || [, 'never'])[1]) || 'never'
      const stampDate = (stamp.match(/\d{4}-\d{2}-\d{2}/) || [])[0] || null

      const entries = []
      const contradictions = []
      const signals = []
      const lines = text.split('\n')
      let section = ''
      for (let i = 0; i < lines.length; i++) {
        const h = lines[i].match(/^##\s+(.+)$/)
        if (h) {
          section = key(h[1])
          continue
        }
        if (!lines[i].trim().startsWith('|')) continue
        const t = readTable(lines, i)
        for (const r of t.rows) {
          if (section.startsWith('entries')) {
            // The shipped template ships a placeholder row with `<YYYY-MM-DD>` in it. A real
            // date is what separates a filled dossier from an empty one, so it is the test.
            const date = plain(r.date)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
            entries.push({ date, source: inline(r.source), state: plain(r.state) || 'new' })
          } else if (section.startsWith('contradictions')) {
            const what = inline(r.whatdisagrees ?? '')
            if (!plain(what)) continue
            contradictions.push({ what, a: inline(r.sourcea ?? ''), b: inline(r.sourceb ?? '') })
          } else if (section.startsWith('revisit')) {
            const record = inline(r.record ?? r.decision ?? '')
            if (!plain(record)) continue
            signals.push({ record, match: inline(r.matchingtext ?? r.match ?? r.signal ?? '') })
          }
        }
        i = t.end - 1
      }

      const files = readdirSync(join(root, base))
        .filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'))
        .sort()
        .reverse()
        .map((f) => {
          const body = read(join(base, f))
          return {
            name: f,
            date: (f.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || '',
            title: inline((body.match(/^#\s+(.+)$/m) || [, f.replace(/\.md$/, '')])[1]),
            path: join(base, f),
            summary: clip(entryProse(body), 220),
            sections: withDiscovery ? splitSections(body) : null,
          }
        })

      // Consumed entries are settled by definition - the stamp is what the spec skills move
      // when they fold one in - so what is live is everything else dated past the stamp, plus
      // anything explicitly left open at any date.
      const live = entries.filter(
        (e) => e.state === 'open' || (e.state !== 'folded-into-spec' && !e.state.startsWith('superseded') && (!stampDate || e.date > stampDate)),
      )

      return {
        topic: d.name,
        title: inline((text.match(/^#\s+(.+)$/m) || [, d.name])[1]),
        summary: clip(sectionBody(text, 'Summary') || boldParagraph(text, 'Summary') || text.replace(/^#.*$/m, ''), 300),
        stamp,
        stampDate,
        entries,
        contradictions,
        signals,
        files,
        live: live.length,
        path: join(base, 'README.md'),
        bodies: withDiscovery,
      }
    })
    .sort((a, b) => (a.topic < b.topic ? -1 : 1))
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
        // Compared against the literal 'open' downstream, and an open sprint written
        // `**open**` would compare unequal and count as closed - taking its items out of the
        // sprint counters with it.
        state: unemphasise(metaRow(text, 'Status') || 'open').toLowerCase(),
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
const backlogRows = backlog.epics.flatMap((e) => e.items)

// R14 puts an idea in `docs/ideas/` under a status, and that folder's README is explicit that
// each idea lives in one file - so a repo following the convention writes its ideas nowhere
// else. The pool only ever read backlog.md, which left the Backlog tab's Ideas chip filtering
// over rows that repo never wrote, while the same ideas rendered fine on Documents. Merged in
// both directions now, deduped on the lowercased title either way, so an idea that is a file
// AND a standard ADR-046 row renders once per tab: the file on Documents (it carries the whole shape),
// the row in the pool (it carries an id, an epic and a DoD).
const ideaDocs = parseIdeas()
const ideaRowTitles = new Set(backlogRows.filter((i) => i.type === 'idea').map((i) => i.title.toLowerCase()))

// Matching on the title alone was not enough, because a row is free to phrase its title
// differently from the heading of the file it points at - and one did: a row titled "Two
// patterns worth adopting from Hermes Agent's real source" against a file headed "Patterns
// worth adopting from Hermes Agent" rendered as two ideas, one of them a promise to weigh
// the other. So a row that LINKS to an idea file claims that file however either is titled;
// the title match stays for a row that cites no file.
const claimedSlugs = new Set(backlogRows.filter((i) => i.type === 'idea').flatMap((i) => i.ideaRefs || []))
const claimedByRow = (d) =>
  ideaRowTitles.has(d.title.toLowerCase()) || claimedSlugs.has(basename(d.path, '.md'))

const items = backlogRows.concat(
  ideaDocs.filter((d) => !claimedByRow(d)).map((d) => {
    // Shaped by asItem() like every other row, so the pool, its search box and the detail
    // dialog read one kind of object. The status goes through splitStatus() with the rest,
    // which knows the idea vocabulary (standard ADR-046) - so `parked` stays parked instead of
    // defaulting to `todo`; plain() first, because a file is free to write it as `**parked**`.
    const item = asItem(
      { id: basename(d.path, '.md'), type: 'idea', status: plain(d.status), why: d.itch },
      '',
    )
    // Both fields are already shaped: parseIdeas() ran inline() over the heading, and inline()
    // escapes what it is handed, so a second pass would render the <code> of the first as
    // text. The file's Date is the date of the status it declares, which is what the row-side
    // `idea (2026-08-03)` spelling puts in the same field.
    item.title = d.title
    item.statusDate = item.statusDate || d.date
    return item
  }),
)

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

// Every document the page renders also links to the file it was rendered from, pinned to the
// commit this build read - so a reader can check the page against the source, and the check
// lands on what the page actually showed rather than on whatever main says today. Absent for
// a repo hosted anywhere else, which costs nothing: the document itself is on the page.
const ghRepo = remote.startsWith('git@github.com:')
  ? 'https://github.com/' + remote.slice('git@github.com:'.length)
  : /^https:\/\/github\.com\//.test(remote)
    ? remote
    : null
const src = ghRepo && commit ? ghRepo + '/blob/' + commit + '/' : null

// The ecosystem switcher - present only when --registry was given. Built from stacks.json,
// the one list that already names every official stack, plus this repository's own identity -
// read the same way `repoName` above is, from its git remote. "here" is decided by comparing
// repo slugs rather than by which command line happened to build this page, so the core's own
// dashboard and every stack's dashboard agree on which one they are looking at.
const CORE_REPO = 'repository-standards/core'
const switcher = (() => {
  if (!registryPath || !existsSync(registryPath)) return null
  let registry
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  } catch {
    return null
  }
  // A stack entry missing what the switcher needs is skipped and reported, the same way the
  // stack loop in pages.yml reports an unreachable repo instead of failing the whole
  // deployment over one bad registry row - the switcher is additive, so its own malformed
  // input must degrade the switcher, never the build.
  const stacks = (Array.isArray(registry.stacks) ? registry.stacks : []).filter((s) => {
    const ok = s && typeof s.technology === 'string' && s.technology && typeof s.repo === 'string' && s.repo
    if (!ok) console.error('dashboard: registry entry missing technology/repo, skipped for the switcher:', JSON.stringify(s))
    return ok
  })
  // Named by repo slug, not a friendly label - the same identity the masthead's own h1
  // already shows for every surface, so the switcher names the thing it switches to
  // exactly as that thing names itself once you are there.
  const surfaces = [
    { name: CORE_REPO, blurb: 'the method - align, verify, drift 0', url: '/dashboard/', repo: CORE_REPO },
    ...stacks.map((s) => ({
      name: s.repo,
      blurb: typeof s.description === 'string' ? s.description : '',
      url: `/${s.technology}/dashboard/`,
      repo: s.repo,
    })),
  ]
  // Fewer than two surfaces is nothing to switch between.
  return surfaces.length < 2 ? null : surfaces.map((s) => ({ ...s, here: s.repo === repoName }))
})()

const data = {
  meta: {
    name: pkg.name || repoName || basename(root),
    home,
    src,
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
    switcher,
  },
  backlog,
  items,
  sprints,
  timeline: parseTimeline(),
  entries,
  releases,
  decisions: parseDecisions(),
  // Two sources, additive: the older per-folder table (parseQuestions/parseIdeas) and,
  // for a repo on standard ADR-046, backlog.md rows of type open-question/idea. asItem() already
  // shaped every backlog item the same way regardless of type, so these are a filter and
  // a re-map, not a second parser.
  questions: parseQuestions().concat(
    backlogRows
      .filter((i) => i.type === 'open-question')
      .map((i) => ({
        topic: i.title,
        // page.js prefixes its own "In force:"/"The doubt:" label - strip the backlog row's
        // own "Decided:"/"the doubt:" lead-in (the standard ADR-046 migration convention) so it does
        // not render doubled, e.g. "In force: Decided: standard ADR-014 - ...".
        decided: i.status === 'decided' ? i.why.replace(/^decided:\s*/i, '') : 'not decided',
        doubt: i.dod.replace(/^the doubt:\s*/i, ''),
        open: i.status !== 'decided',
      })),
  ),
  // Unlike questions, parseIdeas() already walks every file under docs/ideas/ regardless of
  // the README table, and an idea is file-first by convention (docs/ideas/README.md: "each
  // idea lives in one file"). So a backlog row normally names an idea parseIdeas() already
  // found - only titles it did NOT find (a backlog-only idea with no file yet) get added,
  // or the same idea would render twice on the Documents tab. Read from backlogRows rather
  // than items: items now carries the file-based ideas too, and an idea deduped against
  // itself is a merge that only looks right.
  // A row that links to one of those files is that file's row, whatever it calls itself, so
  // it is dropped here on the same key the pool uses rather than on the title alone.
  ideas: (() => {
    const fileTitles = new Set(ideaDocs.map((i) => i.title.toLowerCase()))
    const fileSlugs = new Set(ideaDocs.map((i) => basename(i.path, '.md')))
    const namesAFile = (i) => (i.ideaRefs || []).some((s) => fileSlugs.has(s))
    const fromBacklog = backlogRows
      .filter((i) => i.type === 'idea' && !fileTitles.has(i.title.toLowerCase()) && !namesAFile(i))
      .map((i) => ({ title: i.title, status: i.status, date: i.statusDate, itch: i.why }))
    return ideaDocs.concat(fromBacklog)
  })(),
  specs: parseSpecs(),
  discovery: parseDiscovery(),
}

// Scoped to task/bug: open-question (open|decided) and idea (idea|exploring|...) items carry
// their own vocabulary (standard ADR-046), whether they reached the pool as a backlog row or as a file
// under docs/ideas/, and folding them into the task buckets would misrepresent both - a "todo"
// count that is actually half standing doubts answers no question honestly.
const workItems = items.filter((i) => i.type === 'task' || i.type === 'bug')
const inCycles = sprints.filter((c) => c.state === 'open').flatMap((c) => c.items)
data.counts = {
  todo: workItems.filter((i) => i.status === 'todo').length,
  doing: workItems.filter((i) => i.status === 'doing').length,
  blocked: workItems.filter((i) => i.status === 'blocked').length,
  done: workItems.filter((i) => i.status === 'done').length,
  sprintOpen: sprints.filter((c) => c.state === 'open').length,
  sprintItems: inCycles.length,
  sprintDone: inCycles.filter((i) => i.status === 'done').length,
  unreleased: entries.filter((e) => e.release === 'Unreleased').length,
  openQuestions: data.questions.filter((q) => q.open).length,
  // A spec with an open marker is not ready to develop, and a dossier with unreconciled
  // material is a question somebody is about to be asked twice. Both are states the repo
  // already records and no view has ever surfaced.
  specsBlocked: data.specs.filter((s) => s.markers.length).length,
  discoveryLive: data.discovery.filter((t) => t.live || t.contradictions.length).length,
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

const out = outFlag >= 0 ? resolve(argv[outFlag + 1]) : join(root, '_dashboard/index.html')
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
    .concat(['docs/sprints', 'docs/decision-records', 'docs/ideas', 'docs/open-questions', 'docs/discovery', 'specs'].filter(has))

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
