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

// Plain-text fields (clip()/plain() output from index.mjs) sometimes need to sit inside a
// 'prose' block that otherwise only ever carries pre-escaped markdown HTML - this is the one
// escape hatch for that, not a general-purpose sanitizer.
const escapeHtml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const wrap = (kids) => el('div', { class: 'wrap' }, kids)
// A section this repository has no source for contributes nothing, not an empty node.
const add = (host, ...kids) => host.append(...kids.filter(Boolean))

const LABEL = { doing: 'doing', todo: 'todo', blocked: 'blocked', done: 'done', split: 'split' }
const pill = (status, label) => el('span', { class: 'pill ' + status, text: label || LABEL[status] || status })

// Every document on this page also links to the file it was rendered from, pinned to the
// commit the page was built from. Absent when the repository is not somewhere a link can
// reach, in which case the path is still worth showing: it says where to look.
const srcLink = (path, label) =>
  !path
    ? null
    : D.meta.src
      ? el('a', { class: 'src', href: D.meta.src + path, rel: 'noopener', target: '_blank', text: label || path })
      : el('span', { class: 'src off', text: label || path })

// A spec's status is its own vocabulary, mapped onto the four colours the page already uses
// for everything else - so "live" reads like done and "in-refinement" reads like not-yet.
const SPEC_STATE = {
  live: 'done',
  'ready-to-develop': 'doing',
  'in-refinement': 'todo',
  proposed: 'todo',
  draft: 'todo',
  retired: 'plain',
}

// What closes a row, per type: done/split close a task, graduated/dropped close an idea the
// same way - superseded by its own spec and records, or decided against. open-question's
// "decided" is deliberately absent: a standing decision open to challenge is the point of the
// type, not a completed state to hide (ADR-046). The tab count and the list's own filter read
// this one set, so the number above the list cannot drift from the list.
const CLOSED = new Set(['done', 'split', 'graduated', 'dropped'])

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
const CATS = [...new Set(D.items.concat(D.sprints.flatMap((c) => c.items)).map((i) => i.cap || i.epic).filter(Boolean))].sort()
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

// The ecosystem switcher - present only when index.mjs was run with --registry, so most
// standalone builds render nothing here. Mirrors tools/docsite.mjs's own switcher (name,
// open/close/escape/click-outside), rebuilt with this file's el()-based DOM style instead
// of that one's template-string HTML.
function switcherUI() {
  const items = D.meta.switcher
  if (!items || items.length < 2) return null
  const current = items.find((s) => s.here) || items[0]
  const button = el(
    'button',
    { class: 'tb-switch', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
    [el('span', { text: current.name }), el('span', { class: 'tb-caret', text: '▾' })],
  )
  const menu = el(
    'div',
    { class: 'tb-menu', role: 'menu' },
    items.map((s) =>
      el('a', { class: 'tb-item' + (s.here ? ' here' : ''), href: s.url, role: 'menuitem' }, [
        el('div', { class: 'tb-item-name', text: s.name }),
        s.blurb ? el('div', { class: 'tb-item-blurb', text: s.blurb }) : null,
      ]),
    ),
  )
  const box = el('div', { class: 'tb-switcher' }, [button, menu])
  const close = () => {
    box.classList.remove('open')
    button.setAttribute('aria-expanded', 'false')
  }
  button.addEventListener('click', (e) => {
    e.stopPropagation()
    button.setAttribute('aria-expanded', String(box.classList.toggle('open')))
  })
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })
  return box
}

document.body.append(
  el('header', { class: 'masthead' }, [
    wrap([
      el('div', { class: 'brand' }, [
        D.meta.home
          ? el('a', { class: 'home-link', href: D.meta.home, rel: 'noopener' }, [
              el('h1', { html: D.meta.name + ' <span class="sub">- dashboard</span> <span class="leaves" aria-hidden="true">↗</span>' }),
            ])
          : el('h1', { html: D.meta.name + ' <span class="sub">- dashboard</span>' }),
        switcherUI(),
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
// Reports come from closed sprints and nothing else. A repository without one gets no
// tab rather than a page of activity charts dressed as reports.
const reportable = D.sprints.some((c) => c.stats)
const TABS = [
  { id: 'now', label: 'Now', skip: !D.sprints.length },
  { id: 'timeline', label: 'Timeline', skip: !D.sprints.length },
  { id: 'sprints', label: 'Sprints', n: D.counts.sprintOpen || null, skip: !D.sprints.length },
  // The number on a tab is how many things that tab holds - the same reading as Changelog and
  // Specifications. It used to be todo+doing+blocked, which is the task vocabulary only, so a
  // repo carrying ideas and standing questions had a tab saying 14 above a list saying 41.
  { id: 'backlog', label: 'Backlog', n: D.items.filter((i) => !CLOSED.has(i.status)).length },
  { id: 'specs', label: 'Specifications', n: D.specs.length, skip: !D.specs.length },
  { id: 'reports', label: 'Reports', skip: !reportable },
  { id: 'changelog', label: 'Changelog', n: D.entries.length, skip: !D.entries.length },
  // Named after what it holds, not after a category the reader has to open it to test. A repo
  // that keeps only decision records gets a tab called Decisions; one that also keeps ideas,
  // standing questions or discovery material gets the wider name, because then it is true.
  {
    id: 'docs',
    label: D.ideas.length || D.questions.length || D.discovery.length ? 'Documents' : 'Decisions',
    n: D.decisions.length + D.ideas.length + D.questions.length + D.discovery.length,
    skip: !D.decisions.length && !D.ideas.length && !D.questions.length && !D.discovery.length,
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
      // A section's body is a rendered document, not a sentence: index.mjs turns the source
      // markdown into blocks, and a paragraph cannot contain a list or a table without the
      // browser silently closing it first. One prose container reads both shapes.
      ...(sections || []).filter((s) => s && s[1]).map((s) => el('section', {}, [el('h4', { text: s[0] }), el('div', { class: 'prose', html: s[1] })])),
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

function openSprint(c) {
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
      ['Outcome', c.outcome || (c.state === 'open' ? 'Written when the sprint closes, not before.' : '')],
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
const tracksPeople = D.items.concat(D.sprints.flatMap((c) => c.items)).some((i) => i.assignee)

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
  // The id column was 92px, which is a guess about how long an id is. `STACK-LIFE-1` did not
  // fit and wrapped, and a wrapped id makes its row twice as tall as its neighbours for no
  // reason a reader can see. Measured from the ids instead - in a mono font one character is
  // one ch, so the widest fits exactly and every row still lines up. Measured over the whole
  // pool rather than the list being drawn, so filtering does not shunt every title sideways.
  const idw = Math.min(Math.max(6, ...(D.items.length ? D.items : items).map((i) => i.id.length)), 24)
  return el(
    'div',
    { class: 'pool', style: '--idw:' + idw + 'ch' },
    items.map((i) =>
      el(
        'button',
        { class: 'prow', type: 'button', style: '--cat:' + catVar(i.cap || i.epic), on: { click: () => openItem(i) } },
        [
          el('span', { class: 'pid', text: i.id, title: i.id }),
          el('span', { class: 'pt', html: i.title }),
          el('span', { class: 'pmeta cap', text: i.cap || i.epic || '' }),
          el('span', { class: 'pmeta owner', text: i.owner || '' }),
          el('span', { class: 'pmeta size', text: i.size || '' }),
          // Both pills in one cell. The row is a fixed six-column grid, so a row carrying a
          // type and a status hands it a seventh child, which the grid puts on a line of its
          // own.
          //
          // Only `blocked` earns the status pill: it is the one status that changes what the
          // reader should do with the row. Progress states do not survive contact with a list
          // - a `decided` open question stands answered and stays open to a better answer, but
          // beside a title the chip reads as finished and unimportant, and an idea row renders
          // `idea idea`, its type and its status saying the same word twice. The status is in
          // the detail dialog, which is where the row's own vocabulary is spelled out and
          // qualified.
          el('span', { class: 'ptags' }, [
            i.type && i.type !== 'task' ? el('span', { class: 'pill plain', text: i.type }) : null,
            i.status === 'blocked' ? pill('blocked') : null,
          ]),
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

// Now answers "how is the sprint going" - progress, the delivery forecast, what is in flight.
// A repository that runs no sprints has no such question: what is left is a digest of the
// backlog and the changelog, two tabs away, and a landing screen that repeats them teaches a
// reader that the tabs are decoration. So without sprints the tab is absent, the same way
// every other sourceless tab here is.
//
// The tiles go with it. Without a sprint to measure they count the backlog, and the backlog
// tab already carries its own count in the tab strip and again under the list - a third copy
// of a number is not a summary. What survives is the one thing no tab states: what is worth
// a look, which opens the Backlog, and that is then the first thing you see.
{
  const v = views.now || views.backlog
  const openSprints = D.sprints.filter((c) => c.state === 'open')
  const sprintItems = openSprints.flatMap((c) => c.items)
  const pool = sprintItems.length ? sprintItems : D.items
  const inFlight = pool.filter((i) => i.status === 'doing')
  const blocked = pool.filter((i) => i.status === 'blocked')
  const thisWeek = D.entries.filter((e) => daysAgo(e.date) <= 7).length

  if (views.now) {
    add(
      v,
      el('p', { class: 'eyebrow', text: 'Where the work stands' }),
      tiles([
        openSprints.length
          ? tile('Sprint progress', D.counts.sprintDone + '/' + D.counts.sprintItems, 'is-done', 'items finished in the open sprint')
          : D.entries.length
            ? tile('Changes, 7 days', thisWeek, 'is-done', 'landed on the main line')
            : null,
        tile('In flight', inFlight.length, 'is-doing', 'picked up right now'),
        tile('Waiting', D.counts.todo, '', 'agreed, not started'),
        tile('Blocked', blocked.length, 'is-blocked', 'waiting on something else'),
      ]),
    )
  }

  // Two states the repository has always recorded and no view has ever shown: a spec that
  // cannot be developed because something is missing, and discovery material nobody has
  // reconciled with the spec it belongs to. Both are somebody about to be asked a question
  // they already answered, which is the failure this whole method is built against.
  const attention = [
    D.counts.specsBlocked
      ? {
          n: D.counts.specsBlocked,
          text:
            (D.counts.specsBlocked === 1 ? 'specification is' : 'specifications are') +
            ' not ready to develop - something named in them is missing',
          go: () => select('specs'),
        }
      : null,
    D.counts.discoveryLive
      ? {
          n: D.counts.discoveryLive,
          text:
            (D.counts.discoveryLive === 1 ? 'discovery topic has' : 'discovery topics have') +
            ' material newer than the specification that consumed it, or two sources that disagree',
          go: () => select('docs'),
        }
      : null,
  ].filter(Boolean)

  if (attention.length) {
    add(
      v,
      el('h2', { class: 'section', text: 'Worth a look' }),
      el(
        'div',
        { class: 'list' },
        attention.map((a) =>
          el('div', { class: 'entry clickable', tabindex: '0', role: 'button', on: { click: a.go, keydown: (e) => ((e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), a.go())) } }, [
            el('div', { class: 'top' }, [el('span', { class: 'id', text: String(a.n) }), el('span', { class: 't', text: a.text })]),
          ]),
        ),
      ),
    )
  }

  // Everything below is the sprint's own screen and lives only where that tab does. Without
  // it the backlog board follows directly, which is what the reader came for anyway.
  if (views.now) {
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

  const lanes = D.sprints
    .slice()
    .sort((a, b) => (a.opened < b.opened ? -1 : 1))
    .map((c) => {
      const start = c.opened ? stamp(c.opened) : null
      const target = c.target ? stamp(c.target) : null
      const done = c.items.filter((i) => i.status === 'done' || i.status === 'split').length
      const stand = (D.timeline?.stands || []).find((s) => (s.sprint || '').includes(c.slug))
      const projected = c.state === 'open' ? parseProjected(stand?.projected, c.target) : null
      // The in-sprint rate, stated as such: a small sample, and the reason a sprint drifts
      // quietly. Only shown once something has actually finished.
      const elapsed = start ? Math.max(1, Math.round((now - start) / DAY)) : null
      const left = c.items.length - done
      const pace = c.state === 'open' && done > 0 && left > 0 && elapsed ? now + (left / (done / elapsed)) * DAY : null
      const end = c.state === 'open' ? target : start && c.stats?.days ? start + c.stats.days * DAY : target
      return { c, start, target, end, done, projected, pace }
    })
    .filter((l) => l.start)

  if (!lanes.length) {
    add(v, el('p', { class: 'empty', text: 'No sprint carries dates yet.' }))
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
      el('p', { class: 'eyebrow', text: 'Sprints against the calendar' }),
      el('p', { class: 'lede', text: 'Each bar is one sprint, from the day it opened to the date its team agreed on. The dotted line is today; the projection is measured from closed sprints, never estimated.' }),
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
                el('button', { class: 'gname', type: 'button', on: { click: () => openSprint(c) } }, [
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
            'At the pace this sprint has actually run - ' + openLane.done + ' finished in ' +
            Math.max(1, Math.round((now - openLane.start) / DAY)) + ' days - the remaining ' +
            (openLane.c.items.length - openLane.done) + ' land around <strong>' + nice(isoOf(openLane.pace)) + '</strong>' +
            (late ? ', past the agreed ' + nice(openLane.c.target) + '.' : ', inside the agreed ' + nice(openLane.c.target) + '.') +
            ' The in-sprint rate is a small sample; the projection above uses the historical one.',
        }),
      )
    }
  }
}

/* ---------- view: sprints ---------- */

// Only reached when the repository keeps sprints - the tab is absent otherwise, the same way
// Timeline and Reports are. It used to explain their absence and then show the pool on a
// board underneath, which put the backlog under a heading that says sprint and gave the tab
// something to display rather than something to say.
if (views.sprints) {
  const v = views.sprints
  const open = D.sprints.filter((c) => c.state === 'open')
  const closed = D.sprints.filter((c) => c.state !== 'open')

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Bounded periods of work' }),
    el('p', { class: 'lede', text: 'A sprint is a goal, an agreed end date and the items pulled in for it. An item is in the backlog pool or in exactly one sprint - never both, so no number is counted twice.' }),
  )

  {
    for (const c of open) {
      const late = c.target && today && c.target < today
      add(
        v,
        el('h2', { class: 'section', text: c.team + ' · ' + c.slug }),
        el('div', { class: 'card sprint' }, [
          el('div', { class: 'toprow' }, [
            pill('doing', 'open'),
            el('span', { class: 'meta', text: 'opened ' + shortDate(c.opened) + ' · target ' + shortDate(c.target) }),
            late ? el('span', { class: 'pill blocked', text: 'past its date' }) : null,
            c.owner ? el('span', { class: 'meta', text: 'owner ' + c.owner }) : null,
            el('button', { class: 'chip ghost', type: 'button', text: 'open summary', on: { click: () => openSprint(c) } }),
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
        el('h2', { class: 'section', text: 'Closed sprints' }),
        el('p', { class: 'lede', text: 'What the team believed it would finish, and what actually happened. Open one for its outcome and its items.' }),
        el(
          'div',
          { class: 'grid two' },
          closed.map((c) =>
            el('button', { class: 'card clickable', type: 'button', on: { click: () => openSprint(c) } }, [
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
  const state = { q: '', type: null }

  // The pool is what is still owed, so a closed item leaves it and the tab offers no control
  // to bring it back: finished work is read on Timeline and Reports, and a toggle that turns
  // the pool into a mixed list makes the count under it mean two different things depending
  // on a button nobody remembers pressing. Everything on this tab reads from this list rather
  // than from every row ever written - the type chips included, or a type whose rows are all
  // finished would offer a filter that resolves to nothing.
  const openItems = D.items.filter((i) => !CLOSED.has(i.status))

  // Filtering was by epic, which is a heading in one repository's own backlog file: the chips
  // read as a list of that repository's project names, truncated, and told a reader nothing
  // about what kind of thing a row was. Type is the axis this index is actually built on
  // (ADR-046) - a task, a bug, an idea and a standing question are read differently and by
  // different people - and it is the same everywhere, so the control means the same thing in
  // every repository. The epic is still on every row and still matched by the search box.
  const TYPES = [
    ['task', 'Tasks'],
    ['bug', 'Bugs'],
    ['idea', 'Ideas'],
    ['open-question', 'Open questions'],
  ].filter(([t]) => openItems.some((i) => i.type === t))

  const search = searchBox('Search the pool by title, id or reason…', (q) => {
    state.q = q
    draw()
  })

  const chipRow = el(
    'div',
    { class: 'controls' },
    TYPES.map(([type, label]) =>
      el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': 'false',
        text: label,
        title: type,
        style: '--cat:' + catVar(type),
        on: {
          click: () => {
            state.type = state.type === type ? null : type
            for (const c of chipRow.children) c.setAttribute('aria-pressed', String(c.title === state.type))
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
    el('p', { class: 'lede', text: 'Every item carries the reason it exists and what "done" means for it, both written before the work starts. An item leaves the pool only when that definition is met - or when it is pulled into a sprint.' }),
    el('div', { class: 'controls searchrow' }, [search]),
    TYPES.length > 1 ? chipRow : null,
    host,
  )

  function draw() {
    const items = openItems.filter((i) => {
      if (state.type && i.type !== state.type) return false
      if (!state.q) return true
      return (i.id + ' ' + i.title + ' ' + i.why + ' ' + i.dod + ' ' + i.epic + ' ' + i.cap).toLowerCase().includes(state.q)
    })
    host.replaceChildren(
      items.length ? poolList(items) : el('p', { class: 'empty', text: 'Nothing matches.' }),
      el('p', { class: 'meta count', text: items.length + ' of ' + openItems.length + ' items shown' }),
    )
  }
  draw()
}

/* ---------- view: reports ---------- */

if (views.reports) {
  const v = views.reports
  const closed = D.sprints.filter((c) => c.stats)

  add(
    v,
    el('p', { class: 'eyebrow', text: 'Measured, from closed sprints' }),
    el('p', { class: 'lede', text: 'Two questions a team acts on: did we finish what we said we would, and how fast do we actually go. Both are read from what sprint-close wrote when each sprint ended - no estimates feed them, and nothing is entered anywhere else.' }),
  )

  /* 1. did the sprint deliver what it planned */
  if (closed.length) {
    const max = Math.max(...closed.map((c) => c.stats.finished + c.stats.returned + c.stats.unplanned))
    add(
      v,
      el('h2', { class: 'section', text: 'Planned against delivered' }),
      el('p', { class: 'lede', text: 'Per closed sprint: what was finished, what went back to the pool unfinished, and how much unplanned work arrived after the plan was made. Written by sprint-close, not re-counted here.' }),
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
          'Across ' + closed.length + ' closed sprints: ' +
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
            top.toFixed(2) + ' across ' + rates.length + ' closed sprints.',
        }),
      ]),
    )
  }

}

/* ---------- view: changelog ---------- */

if (views.changelog) {
  const v = views.changelog
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

/* ---------- specifications: the one tab that is the documents themselves ---------- */

// Every other view is a projection of state - what is in flight, what landed, what is
// blocked. This one is the specification, rendered. It exists because the page it belongs to
// showed a spec's title and three hundred characters of its purpose, which is a catalogue
// entry for the one artifact the repository exists to keep true: the requirements, the
// contracts and the acceptance criteria were all somewhere else.
if (views.specs) {
  const v = views.specs
  const state = { q: '', name: D.specs[0]?.name || null }

  const listHost = el('div', { class: 'reader-list' })
  const docHost = el('article', { class: 'doc' })
  const search = searchBox('Search the specifications…', (q) => {
    state.q = q
    // Searching to a single match and then reading it is one gesture, not two.
    const hits = matches()
    if (hits.length && !hits.some((s) => s.name === state.name)) state.name = hits[0].name
    drawList()
    drawDoc()
  })

  add(
    v,
    el('div', { class: 'controls searchrow' }, [search]),
    el('div', { class: 'reader' }, [listHost, docHost]),
  )

  const matches = () =>
    D.specs.filter(
      (s) => !state.q || [s.title, s.name, s.purpose, s.serves, s.status, s.tier].filter(Boolean).join(' ').toLowerCase().includes(state.q),
    )

  function drawList() {
    const list = matches()
    const nodes = list.map((s) =>
      el(
        'button',
        {
          class: 'reader-item' + (s.name === state.name ? ' on' : ''),
          type: 'button',
          on: {
            click: () => {
              state.name = s.name
              drawList()
              drawDoc()
            },
          },
        },
        [
          el('span', { class: 'rt', html: s.title }),
          el('span', { class: 'rm' }, [
            pill(SPEC_STATE[s.status] || 'plain', s.status),
            s.markers.length ? pill('blocked', s.markers.length + ' open') : null,
          ]),
        ],
      ),
    )
    listHost.replaceChildren(...(nodes.length ? nodes : [el('p', { class: 'empty', text: 'Nothing matches "' + state.q + '".' })]))
  }

  function drawDoc() {
    const s = D.specs.find((x) => x.name === state.name)
    if (!s) {
      docHost.replaceChildren()
      return
    }
    docHost.replaceChildren(
      ...[
        el('h2', { html: s.title }),
        el('div', { class: 'head' }, [
          pill(SPEC_STATE[s.status] || 'plain', s.status),
          s.tier ? el('span', { class: 'pill plain', text: s.tier + ' spec' }) : null,
          el('span', { class: 'id', text: s.name }),
        ]),
        s.serves ? el('p', { class: 'field' }, [el('b', { text: 'Serves. ' }), el('span', { text: s.serves })]) : null,
        s.metric ? el('p', { class: 'field' }, [el('b', { text: 'Success metric. ' }), el('span', { text: s.metric })]) : null,
        // The gap list, in the spec's own words. It is the answer to "which spec is blocked,
        // and on whom", which until now needed the clarify gate run by hand, once per spec.
        s.markers.length
          ? el('div', { class: 'gaps' }, [
              el('h4', { text: 'Open markers - not ready to develop' }),
              el(
                'ul',
                {},
                s.markers.map((m) => el('li', {}, [pill('blocked', m.type), el('span', { text: m.note })])),
              ),
            ])
          : null,
        s.sections.length
          ? el(
              'nav',
              { class: 'jump' },
              s.sections.map(([heading], n) =>
                el('button', {
                  type: 'button',
                  text: heading,
                  on: {
                    click: () => docHost.querySelectorAll('section')[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                  },
                }),
              ),
            )
          : null,
        ...s.sections.map(([heading, html]) => el('section', {}, [el('h3', { text: heading }), el('div', { class: 'prose', html })])),
        el('p', { class: 'srcrow' }, [srcLink(s.path, 'Read the source file')]),
      ].filter(Boolean),
    )
    docHost.scrollTop = 0
  }

  drawList()
  drawDoc()
}

if (views.docs) {
  const v = views.docs
  const state = { q: '', kind: null }

  // Specifications used to be listed here as cards, described in a paragraph explaining what
  // a specification is. They have their own tab now, which renders them whole - so this tab
  // keeps the records and the material, and stops introducing a document it cannot open.
  const GROUPS = [
    ['business', 'Business decisions', 'What the product will and will not do, and who it is for. Written by the people who decide that, not translated from an engineering note.'],
    ['technical', 'Technical decisions', 'Every fork the build took, dated, with the context that made it the right call at the time.'],
    ['idea', 'Ideas', 'A feature that may never ship. Written down so the itch behind it survives, and nobody re-argues it from scratch.'],
    ['question', 'Open questions', 'Each has an answer in force and stays open to a better one. "Unanswered" means no answer is in force yet.'],
    [
      'discovery',
      'Discovery',
      'The meetings and mails a specification gets written from, kept with the date and the person they came from. Material, never a decision: where a dossier and a specification disagree, the specification has already won.',
    ],
  ].filter(([kind]) =>
    kind === 'idea'
      ? D.ideas.length
      : kind === 'question'
        ? D.questions.length
        : kind === 'discovery'
          ? D.discovery.length
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
    el('div', { class: 'controls searchrow' }, [search]),
    GROUPS.length > 1 ? chipRow : null,
    host,
  )

  const hits = (...fields) => !state.q || fields.filter(Boolean).join(' ').toLowerCase().includes(state.q)
  const total = D.decisions.length + D.ideas.length + D.questions.length + D.discovery.length

  function draw() {
    const parts = []
    let shown = 0
    for (const [kind, heading, lede] of GROUPS) {
      if (state.kind && state.kind !== kind) continue
      let nodes = []
      if (kind === 'idea') {
        const list = D.ideas.filter((i) => hits(i.title, i.itch, i.status))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'grid two' }, list.map(ideaCard))] : []
      } else if (kind === 'question') {
        const list = D.questions.filter((q) => hits(q.topic, q.decided, q.doubt))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'list' }, list.map(questionRow))] : []
      } else if (kind === 'discovery') {
        const list = D.discovery.filter((t) => hits(t.title, t.topic, t.summary, ...t.files.map((f) => f.title)))
        shown += list.length
        nodes = list.length ? [el('div', { class: 'grid two' }, list.map(discoveryCard))] : []
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

  // A card that summarises a document and cannot open it is the problem this tab had. Every
  // card here now leads somewhere: a spec to the tab that renders it whole, everything else
  // to the same document in the detail panel.
  function clickable(node, open) {
    node.setAttribute('tabindex', '0')
    node.setAttribute('role', 'button')
    node.classList.add('clickable')
    node.addEventListener('click', open)
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open()
      }
    })
    return node
  }

  function ideaCard(i) {
    const dossier = i.discovery && D.discovery.find((t) => t.topic === i.discovery)
    return clickable(
      el('div', { class: 'card' }, [
        el('div', { class: 'toprow' }, [
          el('span', { class: 'pill ' + i.status, text: i.status }),
          el('span', { class: 'meta', text: i.date || '' }),
        ]),
        el('h3', { html: i.title }),
        el('p', { text: i.itch }),
        // Where an idea came from, when it came from somewhere: an idea that grew out of a
        // dossier is not the same object as one somebody had in the shower, and the reader
        // deciding whether to take it seriously is exactly who needs to know which it is.
        dossier ? el('p', { class: 'go', text: 'From discovery: ' + dossier.topic }) : null,
      ]),
      () =>
        openDetail({
          title: i.title,
          meta: [i.status, i.date].filter(Boolean),
          sections: i.sections,
          nodes: [dossier ? el('p', { class: 'srcrow' }, [el('span', { class: 'src off', text: 'discovery: ' + dossier.path })]) : null, el('p', { class: 'srcrow' }, [srcLink(i.path)])],
        }),
    )
  }

  // A dossier's card carries its state, not its material: how much has been folded into a
  // spec, how much is newer than the stamp, and whether two sources disagree. The material
  // itself is on the page only when the build was asked for it (--with-discovery).
  function discoveryCard(t) {
    const live = t.live ? pill('doing', t.live + ' unreconciled') : t.entries.length ? pill('done', 'reconciled') : null
    return clickable(
      el('div', { class: 'card' }, [
        el('div', { class: 'toprow' }, [
          live,
          t.contradictions.length ? pill('blocked', t.contradictions.length + ' contradicting') : null,
          el('span', { class: 'meta', text: t.entries.length + (t.entries.length === 1 ? ' entry' : ' entries') }),
        ]),
        el('h3', { html: t.title }),
        el('p', { text: t.summary }),
        el('p', { class: 'go', text: 'Last reconciled: ' + t.stamp }),
      ]),
      () => openDossier(t),
    )
  }

  function openDossier(t) {
    const table = (head, rows) =>
      el('table', { class: 'mini' }, [
        el('thead', {}, [el('tr', {}, head.map((h) => el('th', { text: h })))]),
        el('tbody', {}, rows),
      ])

    openDetail({
      title: t.title,
      meta: ['last reconciled: ' + t.stamp, t.entries.length + ' entries'],
      sections: [['What this topic is', escapeHtml(t.summary)]],
      nodes: [
        t.contradictions.length
          ? el('section', {}, [
              el('h4', { text: 'Contradictions to resolve' }),
              table(
                ['What disagrees', 'Source', 'Against'],
                t.contradictions.map((c) =>
                  el('tr', {}, [el('td', { html: c.what }), el('td', { html: c.a }), el('td', { html: c.b })]),
                ),
              ),
            ])
          : null,
        t.signals.length
          ? el('section', {}, [
              el('h4', { text: 'Revisit signals hit' }),
              table(
                ['Record', 'Matching text'],
                t.signals.map((s) => el('tr', {}, [el('td', { html: s.record }), el('td', { html: s.match })])),
              ),
            ])
          : null,
        t.entries.length
          ? el('section', {}, [
              el('h4', { text: 'Entries' }),
              table(
                ['Date', 'Source', 'State'],
                t.entries.map((e) =>
                  el('tr', {}, [el('td', { text: e.date }), el('td', { html: e.source }), el('td', { text: e.state })]),
                ),
              ),
            ])
          : null,
        t.files.length
          ? el('section', {}, [
              el('h4', { text: t.bodies ? 'The material' : 'The material - titles only' }),
              el(
                'div',
                { class: 'files' },
                t.files.map((f) =>
                  el('details', {}, [
                    el('summary', {}, [
                      el('span', { class: 'meta', text: f.date }),
                      el('span', { class: 'ft', html: f.title }),
                    ]),
                    ...(f.sections
                      ? f.sections.map(([heading, html]) => el('div', { class: 'prose' }, [el('h5', { text: heading }), el('div', { class: 'prose', html })]))
                      : [
                          el('p', { class: 'note', text: f.summary }),
                          // Said rather than silently omitted: a reader looking at a dossier
                          // with no material needs to know the build withheld it, not guess
                          // that nobody wrote anything down.
                          el('p', { class: 'note off', text: 'The extract itself is not in this page. Rebuild with --with-discovery to carry it, or open the source file.' }),
                        ]),
                    el('p', { class: 'srcrow' }, [srcLink(f.path)]),
                  ]),
                ),
              ),
            ])
          : null,
        el('p', { class: 'srcrow' }, [srcLink(t.path)]),
      ],
    })
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
    const open = () =>
      openDetail({
        id: a.id,
        title: a.title,
        meta: [a.status, a.date],
        // The whole record, not its opening paragraph: the options somebody weighed and the
        // consequences they accepted are the reason a decision record is worth keeping.
        sections: a.sections,
        nodes: [el('p', { class: 'srcrow' }, [srcLink(a.path)])],
      })
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
      el('span', { text: 'Generated from this repository: backlog, sprints, changelog, decision records, specs. Nothing here is typed twice.' }),
      el('span', { html: '<code>node scripts/generate-dashboard/index.mjs</code>' }),
    ]),
  ]),
)

// Whatever the first tab turns out to be for this repository - Now where sprints are run,
// the Backlog where they are not.
select(TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : TABS[0].id)

/* ---------- staleness: update itself, and only ask when asking is the polite thing ---------- */

// The page carries the fingerprint of the content it was built from; state.json carries the
// fingerprint of the newest build. When they diverge the page updates itself and keeps the
// reader's place - the tab is in the URL and the scroll position rides across in session
// storage, so a refresh is invisible.
//
// It waits instead of reloading in one case: the reader is doing something a reload would
// destroy - a record open, a search half-typed, text selected. Then it says so and lets them
// choose. Reloading out from under somebody once is enough for them to stop trusting a page.
const RESUME = 'dashboard:resume'
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
