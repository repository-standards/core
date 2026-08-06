/* Work dashboard - client rendering. All data is inlined by index.mjs;
   nothing here fetches, so the page works from a file:// path and offline. */

const D = JSON.parse(document.getElementById('work-data').textContent)

const el = (tag, props = {}, kids = []) => {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue
    if (k === 'html') n.innerHTML = v
    else if (k === 'text') n.textContent = v
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn)
    else n.setAttribute(k, v === true ? '' : String(v))
  }
  for (const kid of [].concat(kids)) if (kid) n.append(kid)
  return n
}

const wrap = (kids) => el('div', { class: 'wrap' }, kids)
// A section this repository has no source for contributes nothing, not an empty node.
const add = (host, ...kids) => host.append(...kids.filter(Boolean))

const LABEL = { doing: 'doing', todo: 'todo', blocked: 'blocked', done: 'done', split: 'split' }
const pill = (status, label) => el('span', { class: 'pill ' + status, text: label || LABEL[status] || status })

const DAY = 86400000
const today = D.timeline?.generated || D.meta.latest
const stamp = (iso) => Date.parse(iso + 'T00:00:00Z')
const daysAgo = (iso) => Math.round((stamp(today) - stamp(iso)) / DAY)
const nice = (iso) =>
  iso ? new Date(stamp(iso)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-'
const shortDate = (iso) =>
  iso ? new Date(stamp(iso)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '-'
const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10)

// Categorical colour, assigned in a fixed order over the capabilities this repo actually
// has - so a filter that hides one never repaints the others. Past the palette, neutral.
const CATS = [...new Set(D.items.concat(D.cycles.flatMap((c) => c.items)).map((i) => i.cap || i.epic).filter(Boolean))].sort()
const catVar = (name) => {
  const n = CATS.indexOf(name)
  return n >= 0 && n < 6 ? 'var(--c' + (n + 1) + ')' : 'var(--ink-3)'
}

/* ---------- masthead ---------- */

const SUN =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>'
const MOON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">' +
  '<path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4z"/></svg>'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const isDark = () => (document.documentElement.dataset.theme || (prefersDark.matches ? 'dark' : 'light')) === 'dark'

const themeButton = el('button', {
  class: 'theme-toggle',
  type: 'button',
  'aria-label': 'Switch between light and dark',
  on: {
    click: () => {
      document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'
      paintTheme()
    },
  },
})

function paintTheme() {
  themeButton.innerHTML = isDark() ? SUN : MOON
  themeButton.title = isDark() ? 'Switch to light' : 'Switch to dark'
}
prefersDark.addEventListener('change', paintTheme)
paintTheme()

document.body.append(
  el('header', { class: 'masthead' }, [
    wrap([
      el('div', { class: 'brand' }, [
        el('h1', { html: D.meta.name + ' <span class="sub">- work</span>' }),
        D.meta.tagline ? el('p', { text: D.meta.tagline }) : null,
      ]),
      el('div', { class: 'stamp' }, [
        D.meta.version ? el('div', { html: 'version <b>' + D.meta.version + '</b>' }) : null,
        D.meta.latest ? el('div', { html: 'last change <b>' + nice(D.meta.latest) + '</b>' }) : null,
        !D.meta.latest && D.timeline?.generated ? el('div', { html: 'projected <b>' + nice(D.timeline.generated) + '</b>' }) : null,
        D.meta.commit ? el('div', { html: 'commit <b>' + D.meta.commit + '</b>' }) : null,
        el('div', { class: 'theme' }, [themeButton]),
      ]),
    ]),
  ]),
)

/* ---------- tabs ---------- */

// A tab whose source the repository does not keep is not rendered empty - it is absent.
const reportable = D.cycles.some((c) => c.stats) || D.entries.length > 3
const TABS = [
  { id: 'now', label: 'Now' },
  { id: 'timeline', label: 'Timeline', skip: !D.cycles.length },
  { id: 'cycles', label: 'Cycles', n: D.counts.cycleOpen || null },
  { id: 'backlog', label: 'Backlog', n: D.counts.todo + D.counts.doing + D.counts.blocked },
  { id: 'reports', label: 'Reports', skip: !reportable },
  { id: 'history', label: 'History', n: D.entries.length, skip: !D.entries.length },
  {
    id: 'docs',
    label: 'Documents',
    n: D.decisions.length + D.specs.length + D.ideas.length + D.questions.length,
    skip: !D.decisions.length && !D.specs.length && !D.ideas.length && !D.questions.length,
  },
].filter((t) => !t.skip)

const railInner = el('div', { class: 'wrap' })
document.body.append(el('nav', { class: 'rail' }, [railInner]))
const mainWrap = el('div', { class: 'wrap' })
document.body.append(el('main', {}, [mainWrap]))

const views = {}
const buttons = {}
for (const t of TABS) {
  buttons[t.id] = el('button', {
    class: 'tab',
    type: 'button',
    role: 'tab',
    'aria-selected': 'false',
    html: t.label + (t.n ? ' <span class="n">' + t.n + '</span>' : ''),
    on: { click: () => select(t.id) },
  })
  railInner.append(buttons[t.id])
  views[t.id] = el('section', { class: 'view', hidden: true })
  mainWrap.append(views[t.id])
}

function select(id) {
  for (const t of TABS) {
    buttons[t.id].setAttribute('aria-selected', String(t.id === id))
    views[t.id].hidden = t.id !== id
  }
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id)
  window.scrollTo({ top: 0 })
}

/* ---------- detail dialog ---------- */

const dialog = el('dialog')
document.body.append(dialog)
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close()
})

function openDetail({ id, title, status, statusLabel, meta, sections, nodes }) {
  dialog.replaceChildren(
    el('button', { class: 'close', type: 'button', text: '×', 'aria-label': 'Close', on: { click: () => dialog.close() } }),
    el('h3', { html: title }),
    el('div', { class: 'head' }, [
      id ? el('span', { class: 'id', text: id }) : null,
      status ? pill(status, statusLabel) : null,
      ...(meta || []).filter(Boolean).map((m) => el('span', { class: 'pill plain', text: m })),
    ]),
    el('div', { class: 'body' }, [
      ...(sections || []).filter((s) => s && s[1]).map((s) => el('section', {}, [el('h4', { text: s[0] }), el('p', { html: s[1] })])),
      ...(nodes || []).filter(Boolean),
    ]),
  )
  dialog.showModal()
}

function openItem(i) {
  openDetail({
    id: i.id,
    title: i.title,
    status: i.status,
    statusLabel: i.blockedBy ? 'blocked by ' + i.blockedBy : null,
    meta: [i.cap || i.epic, i.persona, i.owner && 'owner: ' + i.owner, i.assignee && 'with ' + i.assignee, i.size, i.statusDate],
    sections: [
      ['Why it matters', i.why],
      ['Done means', i.dod],
      ['Where it stands', i.statusNote],
    ],
  })
}

function openCycle(c) {
  const done = c.items.filter((i) => i.status === 'done' || i.status === 'split').length
  openDetail({
    title: c.goal || c.slug,
    status: c.state === 'open' ? 'doing' : 'done',
    statusLabel: c.state,
    meta: [c.team, c.owner && 'owner ' + c.owner, shortDate(c.opened) + ' → ' + shortDate(c.target)],
    sections: [
      [
        'By the numbers',
        c.stats
          ? 'Planned ' + c.stats.planned + ', finished ' + c.stats.finished + ', returned to the pool ' + c.stats.returned +
            '. Unplanned work absorbed: ' + c.stats.unplanned + '. Days elapsed: ' + c.stats.days + '.'
          : done + ' of ' + c.items.length + ' items done so far.',
      ],
      ['Outcome', c.outcome || (c.state === 'open' ? 'Written when the cycle closes, not before.' : '')],
    ],
    nodes: [
      c.items.length
        ? el('section', {}, [
            el('h4', { text: 'Items' }),
            el(
              'ul',
              { class: 'itemlist' },
              c.items.map((i) =>
                el('li', {}, [
                  el('span', { class: 'dot ' + i.status }),
                  el('span', { class: 'iid', text: i.id }),
                  el('span', { class: 'it', html: i.title }),
                  el('span', { class: 'who', text: i.assignee || '' }),
                ]),
              ),
            ),
          ])
        : null,
    ],
  })
}

/* ---------- shared pieces ---------- */

// One search idiom for every view that can grow long - the pool and the records both do.
const searches = []
function searchBox(placeholder, onChange) {
  const box = el('input', {
    class: 'search',
    type: 'search',
    placeholder: placeholder + '  (press /)',
    'aria-label': placeholder,
    on: { input: (e) => onChange(e.target.value.trim().toLowerCase()) },
  })
  searches.push(box)
  return box
}

document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || /input|textarea/i.test(document.activeElement?.tagName || '')) return
  const visible = searches.find((b) => b.offsetParent !== null)
  if (!visible) return
  e.preventDefault()
  visible.focus()
})

function tile(k, value, cls, hint) {
  return el('div', { class: 'tile ' + (cls || '') }, [
    el('div', { class: 'k', text: k }),
    el('div', { class: 'v', text: String(value) }),
    hint ? el('div', { class: 'hint', text: hint }) : null,
  ])
}

// The row is sized to how many tiles this repository can actually fill, so a repo without
// a changelog does not get a half-empty second row.
function tiles(list) {
  const kids = list.filter(Boolean)
  return el('div', { class: 'tiles', style: '--cols:' + kids.length }, kids)
}

// A repo whose backlog has no assignee column is not a repo where everything is unassigned -
// it is one where the question is not asked, so the card does not ask it.
const tracksPeople = D.items.concat(D.cycles.flatMap((c) => c.items)).some((i) => i.assignee)

/* the kanban card - id, title, who. Everything else is one click away. */
function card(i) {
  return el('button', { class: 'kcard ' + i.status, type: 'button', on: { click: () => openItem(i) } }, [
    el('span', { class: 'kid', text: i.id }),
    el('span', { class: 'kt', html: i.title }),
    tracksPeople ? el('span', { class: 'kwho', text: i.assignee || 'nobody yet' }) : null,
  ])
}

function kanban(items) {
  const cols = [
    ['done', 'Done'],
    ['doing', 'Doing'],
    ['blocked', 'Blocked'],
    ['todo', 'Todo'],
  ].filter(([k]) => k !== 'blocked' || items.some((i) => i.status === 'blocked'))

  return el(
    'div',
    { class: 'kanban', style: '--kcols:' + cols.length },
    cols.map(([k, label]) => {
      const mine = items.filter((i) => i.status === k || (k === 'done' && i.status === 'split'))
      return el('div', { class: 'kcol ' + k }, [
        el('div', { class: 'khead' }, [el('span', { text: label }), el('b', { text: '· ' + mine.length })]),
        el('div', { class: 'kstack' }, mine.length ? mine.map(card) : [el('p', { class: 'empty', text: 'nothing here' })]),
      ])
    }),
  )
}

/* the pool - a ranked list, because the order is the decision */
function poolList(items) {
  return el(
    'div',
    { class: 'pool' },
    items.map((i) =>
      el(
        'button',
        { class: 'prow', type: 'button', style: '--cat:' + catVar(i.cap || i.epic), on: { click: () => openItem(i) } },
        [
          el('span', { class: 'pid', text: i.id }),
          el('span', { class: 'pt', html: i.title }),
          el('span', { class: 'pmeta cap', text: i.cap || i.epic || '' }),
          el('span', { class: 'pmeta owner', text: i.owner || '' }),
          el('span', { class: 'pmeta size', text: i.size || '' }),
          i.status !== 'todo' ? pill(i.status, i.blockedBy ? 'blocked' : null) : null,
        ],
      ),
    ),
  )
}

function progress(items) {
  const done = items.filter((i) => i.status === 'done' || i.status === 'split').length
  const doing = items.filter((i) => i.status === 'doing').length
  const pct = (n) => (items.length ? (n / items.length) * 100 : 0)
  return el('div', { class: 'progress', title: done + ' done, ' + doing + ' in flight, ' + items.length + ' total' }, [
    el('span', { class: 'seg done', style: 'width:' + pct(done) + '%' }),
    el('span', { class: 'seg doing', style: 'width:' + pct(doing) + '%' }),
  ])
}

/* ---------- view: now ---------- */

{
  const v = views.now
  const openCycles = D.cycles.filter((c) => c.state === 'open')
  const cycleItems = openCycles.flatMap((c) => c.items)
  const pool = cycleItems.length ? cycleItems : D.items
  const inFlight = pool.filter((i) => i.status === 'doing')
  const blocked = pool.filter((i) => i.status === 'blocked')
  const thisWeek = D.entries.filter((e) => daysAgo(e.date) <= 7).length

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Where the work stands' }),
    tiles([
      openCycles.length
        ? tile('Cycle progress', D.counts.cycleDone + '/' + D.counts.cycleItems, 'is-done', 'items finished in the open cycle')
        : D.entries.length
          ? tile('Changes, 7 days', thisWeek, 'is-done', 'landed on the main line')
          : null,
      tile('In flight', inFlight.length, 'is-doing', 'picked up right now'),
      tile('Waiting', D.counts.todo, '', 'agreed, not started'),
      tile('Blocked', blocked.length, 'is-blocked', 'waiting on something else'),
    ]),
  )

  if (D.timeline?.stands?.length) {
    add(
      v,
      el('h2', { class: 'section', text: 'Will it land on time' }),
      el('div', { class: 'grid two' }, D.timeline.stands.map(standCard)),
      D.timeline.headline ? el('p', { class: 'note', html: D.timeline.headline }) : null,
    )
  }

  add(
    v,
    el('h2', { class: 'section', text: 'Being worked on' }),
    inFlight.length
      ? el('div', { class: 'grid two' }, inFlight.map(card))
      : el('p', { class: 'empty', text: 'Nothing is picked up right now.' }),
  )

  if (blocked.length) add(v, el('h2', { class: 'section', text: 'Blocked' }), el('div', { class: 'grid two' }, blocked.map(card)))

  if (D.entries.length) {
    add(
      v,
      el('h2', { class: 'section', text: 'Just shipped' }),
      el(
        'div',
        { class: 'list' },
        D.entries.slice(0, 6).map((e) =>
          el('div', { class: 'entry' }, [
            el('div', { class: 'top' }, [el('span', { class: 't', html: e.title }), el('span', { class: 'meta', text: nice(e.date) })]),
            el('p', { text: e.summary }),
          ]),
        ),
      ),
      el('p', {
        class: 'meta count',
        text: thisWeek + ' changes in the last seven days · ' + D.counts.unreleased + ' done and not yet cut into a version',
      }),
    )
  }

  if (D.backlog.note) add(v, el('h2', { class: 'section', text: 'What the owner says is next' }), el('p', { class: 'note', html: D.backlog.note }))
}

function standCard(s) {
  const late = /late|over|past/i.test(s.verdict || '')
  return el('div', { class: 'card stand' + (late ? ' is-late' : '') }, [
    el('div', { class: 'toprow' }, [
      el('span', { class: 'pill plain', text: s.team }),
      el('span', { class: 'meta', text: 'target ' + s.target }),
    ]),
    el('h3', { html: s.goal }),
    el('div', { class: 'kv' }, [
      el('div', {}, [el('span', { class: 'k', text: 'Left' }), el('span', { class: 'val', text: s.remaining })]),
      el('div', {}, [el('span', { class: 'k', text: 'Projected' }), el('span', { class: 'val', html: s.projected })]),
      el('div', {}, [el('span', { class: 'k', text: 'Against target' }), el('span', { class: 'val', html: s.verdict })]),
    ]),
  ])
}

/* ---------- view: timeline (the schedule, not the history) ---------- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// "13-17 Aug", "28 August", "13 Aug - 17 Aug" - the shapes /timeline-update writes.
function parseProjected(text, yearHint) {
  if (!text) return null
  const t = text.replace(/<[^>]+>/g, ' ').replace(/[–—]/g, '-')
  const year = yearHint ? Number(yearHint.slice(0, 4)) : new Date().getUTCFullYear()
  const month = (name) => MONTHS.indexOf(name.slice(0, 3).toLowerCase())

  let m = t.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,})/)
  if (m && month(m[3]) >= 0) return [Date.UTC(year, month(m[3]), +m[1]), Date.UTC(year, month(m[3]), +m[2])]

  m = t.match(/(\d{1,2})\s+([A-Za-z]{3,})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,})/)
  if (m && month(m[2]) >= 0 && month(m[4]) >= 0) return [Date.UTC(year, month(m[2]), +m[1]), Date.UTC(year, month(m[4]), +m[3])]

  m = t.match(/(\d{1,2})\s+([A-Za-z]{3,})/)
  if (m && month(m[2]) >= 0) return [Date.UTC(year, month(m[2]), +m[1]), Date.UTC(year, month(m[2]), +m[1])]

  return null
}

if (views.timeline) {
  const v = views.timeline
  const now = stamp(today)

  const lanes = D.cycles
    .slice()
    .sort((a, b) => (a.opened < b.opened ? -1 : 1))
    .map((c) => {
      const start = c.opened ? stamp(c.opened) : null
      const target = c.target ? stamp(c.target) : null
      const done = c.items.filter((i) => i.status === 'done' || i.status === 'split').length
      const stand = (D.timeline?.stands || []).find((s) => (s.cycle || '').includes(c.slug))
      const projected = c.state === 'open' ? parseProjected(stand?.projected, c.target) : null
      // The in-cycle rate, stated as such: a small sample, and the reason a cycle drifts
      // quietly. Only shown once something has actually finished.
      const elapsed = start ? Math.max(1, Math.round((now - start) / DAY)) : null
      const left = c.items.length - done
      const pace = c.state === 'open' && done > 0 && left > 0 && elapsed ? now + (left / (done / elapsed)) * DAY : null
      const end = c.state === 'open' ? target : start && c.stats?.days ? start + c.stats.days * DAY : target
      return { c, start, target, end, done, projected, pace }
    })
    .filter((l) => l.start)

  if (!lanes.length) {
    add(v, el('p', { class: 'empty', text: 'No cycle carries dates yet.' }))
  } else {
    const t0 = Math.min(...lanes.map((l) => l.start))
    const t1 = Math.max(now, ...lanes.flatMap((l) => [l.end || 0, l.target || 0, l.pace || 0, l.projected?.[1] || 0]))
    const pad = (t1 - t0) * 0.04
    const lo = t0 - pad
    const hi = t1 + pad
    const at = (ms) => ((ms - lo) / (hi - lo)) * 100

    const ticks = []
    const first = new Date(lo)
    for (let d = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1); d < hi; ) {
      ticks.push(d)
      const x = new Date(d)
      d = Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 1)
    }

    add(
      v,
      el('p', { class: 'eyebrow', text: 'Cycles against the calendar' }),
      el('p', { class: 'lede', text: 'Each bar is one cycle, from the day it opened to the date its team agreed on. The dotted line is today; the projection is measured from closed cycles, never estimated.' }),
      el('div', { class: 'gantt' }, [
        el('div', { class: 'glegend' }, [
          el('span', {}, [el('i', { class: 'sw done' }), el('span', { text: 'finished' })]),
          el('span', {}, [el('i', { class: 'sw open' }), el('span', { text: 'still open' })]),
          el('span', {}, [el('i', { class: 'sw band' }), el('span', { text: 'projected landing' })]),
          el('span', {}, [el('i', { class: 'sw target' }), el('span', { text: 'agreed target' })]),
        ]),
        el(
          'div',
          { class: 'glanes' },
          lanes
            .slice()
            .reverse()
            .map((l) => {
              const c = l.c
              const isOpen = c.state === 'open'
              const late = l.pace && l.target && l.pace > l.target
              const span = Math.max(0.6, at(l.end || l.target || now) - at(l.start))
              return el('div', { class: 'glane' + (isOpen ? ' is-open' : '') }, [
                el('button', { class: 'gname', type: 'button', on: { click: () => openCycle(c) } }, [
                  el('span', { class: 'gslug', text: c.slug }),
                  el('span', {
                    class: 'gmeta',
                    text: c.stats
                      ? c.stats.finished + ' of ' + c.stats.planned + ' planned, in ' + c.stats.days + ' days'
                      : l.done + ' of ' + c.items.length + ' done',
                  }),
                ]),
                el('div', { class: 'gtrack' }, [
                  el('div', { class: 'gbar' + (isOpen ? '' : ' closed'), style: 'left:' + at(l.start) + '%;width:' + span + '%' }, [
                    el('span', {
                      class: 'gfill',
                      style: 'width:' + (c.items.length ? (l.done / c.items.length) * 100 : 0) + '%',
                    }),
                    el('span', {
                      class: 'glabel',
                      text: c.stats ? c.stats.finished + '/' + c.stats.planned : l.done + '/' + c.items.length,
                    }),
                  ]),
                  l.projected
                    ? el('div', {
                        class: 'gband',
                        title: 'projected landing',
                        style: 'left:' + at(l.projected[0]) + '%;width:' + Math.max(0.8, at(l.projected[1]) - at(l.projected[0])) + '%',
                      })
                    : null,
                  l.target ? el('div', { class: 'gmark target', style: 'left:' + at(l.target) + '%' }) : null,
                  l.pace
                    ? el('div', {
                        class: 'gmark pace' + (late ? ' late' : ''),
                        style: 'left:' + at(l.pace) + '%',
                        title: 'if today’s pace holds: ' + nice(isoOf(l.pace)),
                      })
                    : null,
                  isOpen ? el('div', { class: 'gmark today', style: 'left:' + at(now) + '%' }) : null,
                ]),
              ])
            }),
        ),
        el('div', { class: 'gaxis' }, [
          el('div', { class: 'gticks' }, [
            ...ticks.map((d) =>
              el('span', { class: 'gtick', style: 'left:' + at(d) + '%' }, [
                el('small', { text: new Date(d).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) }),
              ]),
            ),
            el('span', { class: 'gtick now', style: 'left:' + at(now) + '%' }, [el('small', { text: 'today' })]),
          ]),
        ]),
      ]),
    )

    const openLane = lanes.find((l) => l.c.state === 'open')
    if (openLane?.pace) {
      const late = openLane.target && openLane.pace > openLane.target
      add(
        v,
        el('p', {
          class: 'note' + (late ? ' warn' : ''),
          html:
            'At the pace this cycle has actually run - ' + openLane.done + ' finished in ' +
            Math.max(1, Math.round((now - openLane.start) / DAY)) + ' days - the remaining ' +
            (openLane.c.items.length - openLane.done) + ' land around <strong>' + nice(isoOf(openLane.pace)) + '</strong>' +
            (late ? ', past the agreed ' + nice(openLane.c.target) + '.' : ', inside the agreed ' + nice(openLane.c.target) + '.') +
            ' The in-cycle rate is a small sample; the projection above uses the historical one.',
        }),
      )
    }
  }
}

/* ---------- view: cycles ---------- */

{
  const v = views.cycles
  const open = D.cycles.filter((c) => c.state === 'open')
  const closed = D.cycles.filter((c) => c.state !== 'open')

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Bounded periods of work' }),
    el('p', { class: 'lede', text: 'A cycle is a goal, an agreed end date and the items pulled in for it. An item is in the backlog pool or in exactly one cycle - never both, so no number is counted twice.' }),
  )

  if (!D.cycles.length) {
    add(
      v,
      el('div', { class: 'card' }, [
        el('h3', { text: 'This repository does not run cycles' }),
        el('p', { text: 'Cycles bind at team scale, and this repository has one contributor - work goes straight from the pool into flight. Rather than invent a period nobody agreed to, the page says so and shows what is actually being worked on.' }),
      ]),
      el('h2', { class: 'section', text: 'In flight today' }),
      kanban(D.items.filter((i) => i.status !== 'done')),
    )
  } else {
    for (const c of open) {
      const late = c.target && today && c.target < today
      add(
        v,
        el('h2', { class: 'section', text: c.team + ' · ' + c.slug }),
        el('div', { class: 'card cycle' }, [
          el('div', { class: 'toprow' }, [
            pill('doing', 'open'),
            el('span', { class: 'meta', text: 'opened ' + shortDate(c.opened) + ' · target ' + shortDate(c.target) }),
            late ? el('span', { class: 'pill blocked', text: 'past its date' }) : null,
            c.owner ? el('span', { class: 'meta', text: 'owner ' + c.owner }) : null,
            el('button', { class: 'chip ghost', type: 'button', text: 'open summary', on: { click: () => openCycle(c) } }),
          ]),
          el('h3', { html: c.goal }),
          progress(c.items),
          el('p', {
            class: 'meta',
            text:
              c.items.filter((i) => i.status === 'done').length + ' of ' + c.items.length + ' done · ' +
              c.items.filter((i) => i.status === 'doing').length + ' in flight · ' +
              c.items.filter((i) => i.status === 'todo').length + ' not started',
          }),
        ]),
        kanban(c.items),
      )
    }

    if (closed.length) {
      add(
        v,
        el('h2', { class: 'section', text: 'Closed cycles' }),
        el('p', { class: 'lede', text: 'What the team believed it would finish, and what actually happened. Open one for its outcome and its items.' }),
        el(
          'div',
          { class: 'grid two' },
          closed.map((c) =>
            el('button', { class: 'card clickable', type: 'button', on: { click: () => openCycle(c) } }, [
              el('div', { class: 'toprow' }, [
                pill('done', 'closed'),
                el('span', { class: 'meta', text: shortDate(c.opened) + ' → ' + shortDate(c.target) }),
                c.stats ? el('span', { class: 'meta', text: c.stats.days + ' days' }) : null,
              ]),
              el('h3', { html: c.goal }),
              progress(c.items),
              c.stats
                ? el('p', {
                    class: 'meta',
                    text:
                      'planned ' + c.stats.planned + ' · finished ' + c.stats.finished + ' · returned ' + c.stats.returned +
                      ' · unplanned absorbed ' + c.stats.unplanned,
                  })
                : null,
            ]),
          ),
        ),
      )
    }
  }
}

/* ---------- view: backlog ---------- */

{
  const v = views.backlog
  const epics = D.backlog.epics.map((e) => e.title)
  const state = { q: '', epic: null, hideDone: true }

  const search = searchBox('Search the pool by title, id or reason…', (q) => {
    state.q = q
    draw()
  })

  const doneChip = el('button', {
    class: 'chip',
    type: 'button',
    'aria-pressed': 'false',
    text: 'show finished',
    on: {
      click: (e) => {
        state.hideDone = !state.hideDone
        e.currentTarget.setAttribute('aria-pressed', String(!state.hideDone))
        draw()
      },
    },
  })

  const chipRow = el(
    'div',
    { class: 'controls' },
    epics.map((name) =>
      el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': 'false',
        text: name.length > 30 ? name.slice(0, 28).trimEnd() + '…' : name,
        title: name,
        style: '--cat:' + catVar(name),
        on: {
          click: () => {
            state.epic = state.epic === name ? null : name
            for (const c of chipRow.children) c.setAttribute('aria-pressed', String(c.title === state.epic))
            draw()
          },
        },
      }),
    ),
  )

  const host = el('div')
  add(
    v,
    el('p', { class: 'eyebrow', text: 'The pool · ordered by risk x leverage, top is next' }),
    el('p', { class: 'lede', text: 'Every item carries the reason it exists and what "done" means for it, both written before the work starts. An item leaves the pool only when that definition is met - or when it is pulled into a cycle.' }),
    el('div', { class: 'controls searchrow' }, [search, doneChip]),
    epics.length > 1 ? chipRow : null,
    host,
  )

  function draw() {
    const items = D.items.filter((i) => {
      if (state.hideDone && (i.status === 'done' || i.status === 'split')) return false
      if (state.epic && i.epic !== state.epic) return false
      if (!state.q) return true
      return (i.id + ' ' + i.title + ' ' + i.why + ' ' + i.dod + ' ' + i.epic + ' ' + i.cap).toLowerCase().includes(state.q)
    })
    host.replaceChildren(
      items.length ? poolList(items) : el('p', { class: 'empty', text: 'Nothing matches.' }),
      el('p', { class: 'meta count', text: items.length + ' of ' + D.items.length + ' items shown' }),
    )
  }
  draw()
}

/* ---------- view: reports ---------- */

if (views.reports) {
  const v = views.reports
  const closed = D.cycles.filter((c) => c.stats)

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Four questions, answered from the repository' }),
    el('p', { class: 'lede', text: 'Only the reports a team actually acts on: did we finish what we said, how fast do we really go, how much is landing, and where is the effort going. Every number is read from a file in this repository - none of it is entered anywhere else.' }),
  )

  /* 1. did the cycle deliver what it planned */
  if (closed.length) {
    const max = Math.max(...closed.map((c) => c.stats.finished + c.stats.returned + c.stats.unplanned))
    add(
      v,
      el('h2', { class: 'section', text: 'Planned against delivered' }),
      el('p', { class: 'lede', text: 'Per closed cycle: what was finished, what went back to the pool unfinished, and how much unplanned work arrived after the plan was made. Written by cycle-close, not re-counted here.' }),
      el('div', { class: 'card' }, [
        el('div', { class: 'legend' }, [
          el('span', {}, [el('i', { class: 'sw done' }), el('span', { text: 'finished' })]),
          el('span', {}, [el('i', { class: 'sw returned' }), el('span', { text: 'returned to the pool' })]),
          el('span', {}, [el('i', { class: 'sw unplanned' }), el('span', { text: 'unplanned, absorbed' })]),
        ]),
        el(
          'div',
          { class: 'hbars' },
          closed
            .slice()
            .reverse()
            .map((c) =>
              el('div', { class: 'hrow' }, [
                el('span', { class: 'hlabel', text: c.slug }),
                el('span', { class: 'htrack' }, [
                  el('i', { class: 'hseg done', style: 'width:' + (c.stats.finished / max) * 100 + '%', title: c.stats.finished + ' finished' }),
                  el('i', { class: 'hseg returned', style: 'width:' + (c.stats.returned / max) * 100 + '%', title: c.stats.returned + ' returned' }),
                  el('i', { class: 'hseg unplanned', style: 'width:' + (c.stats.unplanned / max) * 100 + '%', title: c.stats.unplanned + ' unplanned' }),
                ]),
                el('span', { class: 'hval', text: c.stats.finished + '/' + c.stats.planned }),
              ]),
            ),
        ),
      ]),
      el('p', {
        class: 'meta count',
        text:
          'Across ' + closed.length + ' closed cycles: ' +
          closed.reduce((n, c) => n + c.stats.finished, 0) + ' finished of ' +
          closed.reduce((n, c) => n + c.stats.planned, 0) + ' planned, with ' +
          closed.reduce((n, c) => n + c.stats.unplanned, 0) + ' unplanned items absorbed.',
      }),
    )
  }

  /* 2. how fast the team actually goes */
  if (closed.length) {
    const rates = closed.map((c) => ({
      slug: c.slug,
      rate: (c.stats.finished + c.stats.unplanned) / Math.max(1, c.stats.days),
    }))
    const mean = rates.reduce((n, r) => n + r.rate, 0) / rates.length
    const top = Math.max(...rates.map((r) => r.rate))
    add(
      v,
      el('h2', { class: 'section', text: 'How fast the team really goes' }),
      el('p', { class: 'lede', text: 'Items per elapsed day, counting unplanned work - a team that finished four while absorbing four did not move at four items’ pace. This is the number the projection uses; no estimates feed it.' }),
      el('div', { class: 'card' }, [
        el(
          'div',
          { class: 'hbars' },
          rates
            .slice()
            .reverse()
            .map((r) =>
              el('div', { class: 'hrow' }, [
                el('span', { class: 'hlabel', text: r.slug }),
                el('span', { class: 'htrack' }, [el('i', { class: 'hseg accent', style: 'width:' + (r.rate / top) * 100 + '%' })]),
                el('span', { class: 'hval', text: r.rate.toFixed(2) + '/day' }),
              ]),
            ),
        ),
        el('p', {
          class: 'meta',
          text:
            'Mean ' + mean.toFixed(2) + ' per day, spread ' + Math.min(...rates.map((r) => r.rate)).toFixed(2) + ' to ' +
            top.toFixed(2) + ' across ' + rates.length + ' closed cycles.',
        }),
      ]),
    )
  }

  /* 3. how much is landing */
  if (D.entries.length > 3) {
    const state = { grain: 'week' }
    const host = el('div')
    const toggle = ['week', 'month'].map((g) =>
      el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(g === 'week'),
        text: 'by ' + g,
        on: {
          click: () => {
            state.grain = g
            for (const b of toggle) b.setAttribute('aria-pressed', String(b.textContent === 'by ' + g))
            drawVolume()
          },
        },
      }),
    )

    add(
      v,
      el('h2', { class: 'section', text: 'How much is landing' }),
      el('p', { class: 'lede', text: 'Recorded changes per period, from the changelog. It answers "is the pace holding" without anyone counting commits by hand.' }),
      el('div', { class: 'controls' }, toggle),
      host,
    )

    function drawVolume() {
      const buckets = new Map()
      for (const e of D.entries) {
        const d = new Date(stamp(e.date))
        let key
        if (state.grain === 'month') key = e.date.slice(0, 7)
        else {
          const m = new Date(d)
          m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7))
          key = isoOf(m.getTime())
        }
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
      const rows = [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-14)
      const max = Math.max(...rows.map((r) => r[1]), 1)
      host.replaceChildren(
        el('div', { class: 'card' }, [
          el(
            'div',
            { class: 'bars tall' },
            rows.map(([k, n]) =>
              el('div', { class: 'barwrap', title: n + ' changes · ' + (state.grain === 'month' ? k : 'week of ' + nice(k)) }, [
                el('div', { class: 'bar', style: 'height:' + Math.max(2, (n / max) * 100) + '%' }),
                el('small', { text: state.grain === 'month' ? k.slice(5) : shortDate(k) }),
              ]),
            ),
          ),
          el('p', { class: 'meta', text: 'Busiest ' + state.grain + ': ' + max + ' changes. ' + D.entries.length + ' recorded in total.' }),
        ]),
      )
    }
    drawVolume()
  }

  /* 4. where the effort went */
  {
    const finished = D.cycles.flatMap((c) => c.items).concat(D.items).filter((i) => i.status === 'done' || i.status === 'split')
    const byCat = new Map()
    for (const i of finished) {
      const k = i.cap || i.epic || 'unattributed'
      byCat.set(k, (byCat.get(k) || 0) + 1)
    }
    const rows = [...byCat.entries()].sort((a, b) => b[1] - a[1])
    if (rows.length > 1) {
      const max = rows[0][1]
      add(
        v,
        el('h2', { class: 'section', text: 'Where the effort went' }),
        el('p', { class: 'lede', text: 'Finished items by the capability they belong to. It answers the question a stakeholder actually asks - "what did we spend the quarter on" - without a timesheet.' }),
        el('div', { class: 'card' }, [
          el(
            'div',
            { class: 'hbars' },
            rows.map(([k, n]) =>
              el('div', { class: 'hrow' }, [
                el('span', { class: 'hlabel', text: k }),
                el('span', { class: 'htrack' }, [
                  el('i', { class: 'hseg', style: 'width:' + (n / max) * 100 + '%;background:' + catVar(k) }),
                ]),
                el('span', { class: 'hval', text: String(n) }),
              ]),
            ),
          ),
          el('p', { class: 'meta', text: finished.length + ' finished items counted, across ' + rows.length + ' areas.' }),
        ]),
      )
    }
  }
}

/* ---------- view: history ---------- */

if (views.history) {
  const v = views.history
  const max = Math.max(...D.weeks.map((w) => w.count), 1)
  const releaseByDate = new Map(D.releases.filter((r) => r.date).map((r) => [r.date, r]))
  const PER_DAY = 6

  const byDay = []
  for (const e of D.entries) {
    const last = byDay[byDay.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else byDay.push({ date: e.date, items: [e] })
  }

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Everything that changed, newest first' }),
    el('p', { class: 'lede', text: 'One entry per change, read from the changelog - the repository keeps no second history. Each entry says what was wrong and what is true now.' }),
    el(
      'div',
      { class: 'spine' },
      byDay.slice(0, 45).map((d) => {
        const rel = releaseByDate.get(d.date)
        const shown = d.items.slice(0, PER_DAY)
        const rest = d.items.slice(PER_DAY)
        const items = el('div', { class: 'items' }, shown.map(entryCard))
        const more =
          rest.length &&
          el('button', {
            class: 'chip more',
            type: 'button',
            text: '+ ' + rest.length + ' more that day',
            on: {
              click: (e) => {
                items.append(...rest.map(entryCard))
                e.currentTarget.remove()
              },
            },
          })
        return el('div', { class: 'day' + (rel ? ' is-release' : '') }, [
          el('div', { class: 'when' }, [
            el('span', { text: nice(d.date) }),
            el('small', { text: d.items.length + (d.items.length === 1 ? ' change' : ' changes') }),
          ]),
          rel ? el('div', { class: 'relmark', text: 'released ' + rel.version }) : null,
          items,
          more || null,
        ])
      }),
    ),
  )

  function entryCard(e) {
    return el('div', { class: 'item' }, [el('div', { class: 't', html: e.title }), el('p', { text: e.summary })])
  }
}

/* ---------- view: documents ---------- */

if (views.docs) {
  const v = views.docs
  const state = { q: '', kind: null }

  const GROUPS = [
    ['spec', 'Capability specs', 'One per capability, never per ticket: what it must do, who it serves, how you know it works.'],
    ['business', 'Business decisions', 'What the product will and will not do, and who it is for. Written by the people who decide that, not translated from an engineering note.'],
    ['technical', 'Technical decisions', 'Every fork the build took, dated, with the context that made it the right call at the time.'],
    ['idea', 'Ideas', 'A feature that may never ship. Written down so the itch behind it survives, and nobody re-argues it from scratch.'],
    ['question', 'Open questions', 'Each has an answer in force and stays open to a better one. "Unanswered" means no answer is in force yet.'],
  ].filter(([kind]) =>
    kind === 'spec'
      ? D.specs.length
      : kind === 'idea'
        ? D.ideas.length
        : kind === 'question'
          ? D.questions.length
          : D.decisions.some((a) => a.kind === kind),
  )

  const search = searchBox('Search every record by title, id or content…', (q) => {
    state.q = q
    draw()
  })

  const chipRow = el(
    'div',
    { class: 'controls' },
    GROUPS.map(([kind, heading]) =>
      el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': 'false',
        text: heading,
        title: kind,
        on: {
          click: () => {
            state.kind = state.kind === kind ? null : kind
            for (const c of chipRow.children) c.setAttribute('aria-pressed', String(c.title === state.kind))
            draw()
          },
        },
      }),
    ),
  )

  const host = el('div')
  add(
    v,
    el('p', { class: 'eyebrow', text: 'The reasoning, kept with the code' }),
    tiles([
      D.meta.rules ? tile('Rules', D.meta.rules, '', 'the normative core') : null,
      tile('Decisions', D.decisions.length, '', 'forks taken, with reasons'),
      tile('Capability specs', D.specs.length, '', 'what each part must do'),
      D.meta.skills ? tile('Procedures', D.meta.skills, '', 'runnable by an agent') : null,
    ]),
    el('div', { class: 'controls searchrow' }, [search]),
    GROUPS.length > 1 ? chipRow : null,
    host,
  )

  const hits = (...fields) => !state.q || fields.filter(Boolean).join(' ').toLowerCase().includes(state.q)
  const total = D.decisions.length + D.specs.length + D.ideas.length + D.questions.length

  function draw() {
    const parts = []
    let shown = 0
    for (const [kind, heading, lede] of GROUPS) {
      if (state.kind && state.kind !== kind) continue
      let nodes = []
      if (kind === 'spec') {
        const list = D.specs.filter((s) => hits(s.title, s.name, s.purpose, s.serves, s.status))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'grid two' }, list.map(specCard))] : []
      } else if (kind === 'idea') {
        const list = D.ideas.filter((i) => hits(i.title, i.itch, i.status))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'grid two' }, list.map(ideaCard))] : []
      } else if (kind === 'question') {
        const list = D.questions.filter((q) => hits(q.topic, q.decided, q.doubt))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'list' }, list.map(questionRow))] : []
      } else {
        const list = D.decisions.filter((a) => a.kind === kind && hits(a.id, a.title, a.context, a.status))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'list' }, list.map(recordRow))] : []
      }
      if (!nodes.length) continue
      parts.push(el('h2', { class: 'section', text: heading }), el('p', { class: 'lede', text: lede }), ...nodes)
    }
    if (!shown) parts.push(el('p', { class: 'empty', text: 'Nothing matches "' + state.q + '".' }))
    else if (state.q || state.kind) parts.push(el('p', { class: 'meta count', text: shown + ' of ' + total + ' records shown' }))
    host.replaceChildren(...parts)
  }
  draw()

  function specCard(s) {
    return el('div', { class: 'card' }, [
      el('div', { class: 'toprow' }, [
        el('span', { class: 'pill plain', text: s.status }),
        s.tier ? el('span', { class: 'meta', text: s.tier + ' spec' }) : null,
      ]),
      el('h3', { html: s.title }),
      el('p', { text: s.purpose }),
    ])
  }

  function ideaCard(i) {
    return el('div', { class: 'card' }, [
      el('div', { class: 'toprow' }, [
        el('span', { class: 'pill plain', text: i.status }),
        el('span', { class: 'meta', text: i.date || '' }),
      ]),
      el('h3', { html: i.title }),
      el('p', { text: i.itch }),
    ])
  }

  function questionRow(q) {
    return el('div', { class: 'entry' }, [
      el('div', { class: 'top' }, [
        el('span', { class: 't', html: q.topic }),
        q.open ? pill('doing', 'unanswered') : pill('done', 'answered, for now'),
      ]),
      el('p', { html: '<strong>In force:</strong> ' + q.decided }),
      q.doubt ? el('p', { html: '<strong>The doubt:</strong> ' + q.doubt }) : null,
    ])
  }

  function recordRow(a) {
    const open = () => openDetail({ id: a.id, title: a.title, meta: [a.status, a.date], sections: [['Context', a.context]] })
    return el(
      'div',
      {
        class: 'entry clickable',
        tabindex: '0',
        role: 'button',
        on: {
          click: open,
          keydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              open()
            }
          },
        },
      },
      [
        el('div', { class: 'top' }, [
          el('span', { class: 'id', text: a.id }),
          el('span', { class: 't', html: a.title }),
          el('span', { class: 'meta', text: [a.status, a.date].filter(Boolean).join(' · ') }),
        ]),
        el('p', { text: a.context }),
      ],
    )
  }
}

/* ---------- footer + boot ---------- */

document.body.append(
  el('footer', {}, [
    wrap([
      el('span', { text: 'Generated from this repository: backlog, cycles, changelog, decision records, specs. Nothing here is typed twice.' }),
      el('span', { html: '<code>node scripts/generate-dashboard/index.mjs</code>' }),
    ]),
  ]),
)

select(TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : 'now')

/* ---------- staleness: update itself, and only ask when asking is the polite thing ---------- */

// The page carries the fingerprint of the content it was built from; state.json carries the
// fingerprint of the newest build. When they diverge the page updates itself and keeps the
// reader's place - the tab is in the URL and the scroll position rides across in session
// storage, so a refresh is invisible.
//
// It waits instead of reloading in one case: the reader is doing something a reload would
// destroy - a record open, a search half-typed, text selected. Then it says so and lets them
// choose. Reloading out from under somebody once is enough for them to stop trusting a page.
const RESUME = 'work-dashboard:resume'
try {
  const saved = sessionStorage.getItem(RESUME)
  if (saved) {
    sessionStorage.removeItem(RESUME)
    const { y } = JSON.parse(saved)
    requestAnimationFrame(() => window.scrollTo({ top: y }))
  }
} catch {
  /* private mode, or no storage - the page just opens at the top */
}

if (location.protocol !== 'file:' && D.meta.fingerprint) {
  const POLL = 45_000
  let banner = null

  const busy = () =>
    dialog.open ||
    document.activeElement?.classList.contains('search') ||
    String(getSelection() || '').length > 0

  const refresh = () => {
    try {
      sessionStorage.setItem(RESUME, JSON.stringify({ y: window.scrollY }))
    } catch {
      /* the scroll position is a nicety, not a reason to skip the refresh */
    }
    location.reload()
  }

  const ask = (state) => {
    if (banner) return
    const moved = state.commit && state.commit !== D.meta.commit
    banner = el('div', { class: 'stale', role: 'status' }, [
      el('span', {}, [
        el('span', { text: 'The work moved on' }),
        moved ? el('span', { text: ' - now at ' }) : null,
        moved ? el('b', { text: state.commit }) : null,
        el('span', { text: '.' }),
      ]),
      el('button', { class: 'chip', type: 'button', text: 'Refresh', on: { click: refresh } }),
      el('button', { class: 'chip ghost', type: 'button', text: 'Later', on: { click: () => banner.remove() } }),
    ])
    document.body.append(banner)
  }

  const check = async () => {
    try {
      const res = await fetch('state.json', { cache: 'no-store' })
      if (!res.ok) return
      const state = await res.json()
      if (!state.fingerprint || state.fingerprint === D.meta.fingerprint) return
      if (busy()) ask(state)
      else refresh()
    } catch {
      /* offline, or the page was opened without its sidecar - not worth a message */
    }
  }

  setInterval(check, POLL)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check()
  })
}
