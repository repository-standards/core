#!/usr/bin/env node
// Work-sprint guard (ADR-028).
//
// One intent is in the backlog pool OR in exactly one sprint - never both, never two.
// That property is what makes the pair trustworthy: a backlog that also lists what is
// already in flight is a backlog nobody believes, and a convention held by discipline
// stops being held. So it is checked rather than asked for.
//
// Six directions, all checked: an id in more than one place (the clash check below), the
// same *work* in more than one place under two ids (the title check - a copy-then-renumber
// passes every id-keyed check ever written), an id a closed sprint's outcome names as
// "returned to the pool" that never actually lands there (the "at least one" check further
// down), a sprint file whose rows this guard cannot find at all (`unreadable`, also below), a
// `blocked:`/`split:` status pointing at work that is finished or was never there, and the
// pool's in-flight pointer rows against the sprints they name. Every one of them looks
// identical to a clean repo from the outside, which is the only reason they are here.
//
// Usage:
//   node scripts/sprint-guard.mjs            # report, exit 0 (advisory)
//   node scripts/sprint-guard.mjs --block    # exit 1 on a violation (CI, scale profile)
//
// No dependencies (Node built-ins only). A repo with no sprint files is not using sprints -
// the guard says so and exits 0, at every profile.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const block = process.argv.includes("--block");
// Both manifest paths. `backlog.md` is the primary and `docs/backlog.md` the altPath, so a
// repo satisfying the manifest at its primary path must not silently lose half the check -
// which is exactly what one hardcoded path did.
const POOLS = ["docs/backlog.md", "backlog.md"];
const CYCLES = "docs/sprints";
// Derived or descriptive, not sprints. /timeline-update writes TIMELINE.md here and it
// legitimately names the intents it projects; counting it would make the timeline collide
// with the sprints it was generated from, on a file the standard's own skill just wrote.
const NOT_A_CYCLE = new Set(["TIMELINE.md", "README.md"]);

// An intent id: INV-3 or PAY-2 where the prefix is the row's capability, ADR-auth or DRIFT-2
// where the row has none. Anchored, so prose in the first cell never looks like one. Which
// prefix to write is one convention with one home - `docs/backlog.md`; this only matches it.
const ID = /^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$/;

// A cell as the author wrote it vs. the value in it: `PAY-2` and **PAY-2** are the same
// intent as PAY-2. Markup around an id was invisible to the anchored pattern above, so a
// table that formats its ids - a perfectly ordinary thing to do - read as a table with no
// intents in it, and the duplicate it held was reported as OK.
const unwrap = (cell) => (cell ?? "").replace(/^[`*_\s]+/, "").replace(/[`*_\s]+$/, "");

// A title as one piece of work rather than as a string: markup anywhere in it is
// formatting, and spacing is typing. `Build the **happy path**` and `Build the happy path`
// are the same intent, and the whole point of the title check is that it survives the
// cosmetic edits a copied row picks up. A title carrying no letter or digit (`-`, a lone
// dash) identifies nothing and is not compared - tested with a Unicode class, so a repo
// writing its titles in a non-Latin script is checked rather than quietly exempted.
const asWork = (cell) => {
  const t = (cell ?? "").replace(/[`*_]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  return /[\p{L}\p{N}]/u.test(t) ? t : "";
};

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    // `_` marks a template - as a file or as a directory. Their example rows would
    // otherwise collide with the pool the moment the tree lands.
    if (e.startsWith("_")) continue;
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith(".md") && !NOT_A_CYCLE.has(e)) acc.push(p);
  }
  return acc;
};

// `blocked:PAY-1` in the status cell. Blocking gets no column of its own: the status
// already carries `blocked`, and what it lacks is *what* blocks it. Folding the reference
// into the existing cell keeps a wide table from getting wider.
const BLOCKED_BY = /^blocked\s*:\s*([A-Z][A-Z0-9]*-[A-Za-z0-9-]+)$/i;

// `split:PAY-8` on a row leaving a sprint: the row finished the part it still covers, and
// PAY-8 is the new backlog row cut for what remains (ADR-029). It is finished work, so a
// block naming it has stopped applying exactly as a `done` one has - and reading it as
// merely "some status" is how a block on finished work kept reporting itself live.
// The reference is checked, not decorative: without that, three words in a status cell
// would retire any row and silently disarm every block pointing at it.
const SPLIT_AS = /^split\s*:\s*([A-Z][A-Z0-9]*-[A-Za-z0-9-]+)$/i;

// A markdown table separator cell (`---`, `:--`, `--:`, `:-:`). Recognizing it is what lets
// the row above it be read as a header, rather than assuming the id sits at column 0.
const SEP_CELL = /^:?-+:?$/;

// The two `## ` sections read by name. `## In flight *(scale - ...)*` carries the heading's
// own parenthetical in the shipped template, so the match is anchored at the start and not
// against the whole line.
const INTENTS = /^intents\b/i;
const IN_FLIGHT = /^in[ -]?flight\b/i;
const OUTCOME = /^outcome\b/i;

// Every scan below reads the same markdown the same way, and the comment state machine had
// already been copied twice before a third reader needed it.
//
// Comment state is scanned left to right *within* the line rather than with two independent
// `includes` calls. The naive version had two holes: `| PAY-7 | fix <!-- was PAY-4 --> the
// export |` opened and closed on one line and deleted a real row, and a `-->` appearing in
// prose (`migrate A --> B`) inside an example block ended the comment early, resurrecting
// every example row after it.
//
// The `## ` heading each line sits under travels with it, because scoping a scan to a
// heading is how these checks switch themselves off. sprint-close's own documented output is
// a close table under `## Outcome` whose rows start with the same intent ids on purpose - a
// reader screenshots that table into a channel. Unscoped, this guard read it as a second
// copy of every intent it names and reported the exact "copied, not moved" failure it exists
// to catch, on a sprint that was closed correctly. Only an H2 changes the section: a `###`
// under `## Intents` is still inside it.
function* lines(file) {
  let commented = false;
  let fenced = false;
  let heading = null;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!commented && !fenced) {
      const h = /^##\s+(.*)$/.exec(line);
      if (h) {
        heading = h[1].trim();
        yield { heading, text: "" };
        continue;
      }
    }
    if (!commented && /^(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    let rest = line;
    let visible = "";
    while (rest) {
      if (commented) {
        const end = rest.indexOf("-->");
        if (end === -1) break;
        commented = false;
        rest = rest.slice(end + 3);
      } else {
        const start = rest.indexOf("<!--");
        if (start === -1) {
          visible += rest;
          break;
        }
        visible += rest.slice(0, start);
        commented = true;
        rest = rest.slice(start + 4);
      }
    }
    if (fenced) continue;
    yield { heading, text: visible.trim() };
  }
}

// A markdown table row split into its cells, or null when the line is not one. The empty
// strings a leading and trailing `|` produce are dropped, so the status is simply the last
// cell however many columns the table carries.
const cellsOf = (text) => {
  if (!text.startsWith("|")) return null;
  const cells = text.split("|").map((c) => c.trim());
  if (cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
};

const columnNamed = (header, name) =>
  header ? header.findIndex((h) => unwrap(h).toLowerCase() === name) : -1;

// Intent rows from a file's markdown tables, optionally only from one `## ` section.
//
// Scoping to a heading is also how the check switches itself off, which is why the scan
// reports what it saw as well as what it found: a sprint file using `### Intents`, `## Work`
// or the id-and-title-in-one-cell shape that the folder manual documented yielded zero
// rows, and zero rows is indistinguishable from a clean sprint. Both are errors now, and
// `sawSection` / `bodyRows` are what the caller needs to tell them apart.
//
// The id cell is found by the header row's `id` column, not by position. A hardcoded column
// 0 broke the moment a table prepended a column of its own (a priority, a team) ahead of
// it - the row still had an id, just not where the guard was looking, so it silently stopped
// counting. The columns are re-resolved every time a separator row is seen, from the header
// row captured just above it; a table naming neither `id` nor `title` falls back to the
// first cell and the one after it, which is every table this guard already shipped against.
const scan = (file, only = null) => {
  const found = [];
  let sawSection = only === null;
  let bodyRows = 0; // table rows in scope that are neither header nor separator
  let headerCells = null; // the header row captured for the table currently being read
  let idCol = 0;
  let titleCol = 1;
  for (const { heading, text } of lines(file)) {
    if (only !== null) {
      if (heading === null || !only.test(heading)) continue;
      sawSection = true;
    }
    const cells = cellsOf(text);
    if (cells === null) {
      headerCells = null; // a blank line, a heading or prose ends the table
      continue;
    }
    if (cells.length && cells.every((c) => SEP_CELL.test(c))) {
      // The header underline - lock in the columns from the header row just above it.
      const id = columnNamed(headerCells, "id");
      const title = columnNamed(headerCells, "title");
      idCol = id >= 0 ? id : 0;
      titleCol = title >= 0 ? title : idCol + 1;
      continue;
    }
    if (headerCells === null) {
      headerCells = cells; // the header row itself
      continue;
    }
    if (cells.every((c) => c === "")) continue; // the template's blank row
    bodyRows++;
    const id = unwrap(idCol < cells.length ? cells[idCol] : cells[0]);
    if (!id || !ID.test(id)) continue;
    found.push({
      id,
      title: titleCol < cells.length ? cells[titleCol] : "",
      // As written. Lowercasing the whole cell here and restoring the reference's case
      // afterwards is what made `blocked:ADR-auth` - the guard's own documented id form -
      // report `ADR-AUTH exists nowhere` on a repo that was correct.
      status: unwrap(cells[cells.length - 1]),
    });
  }
  return { rows: found, sawSection, bodyRows };
};

// Status is declared once, in the header table (`| **Status** | closed |`) - never inside
// `## Intents`, never commented out, so a direct scan is enough.
const STATUS_CELL = /\*\*status\*\*\s*\|\s*([^|]+?)\s*\|/i;
const readCycleStatus = (file) => {
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const m = raw.match(STATUS_CELL);
    if (m) return m[1].trim().toLowerCase();
  }
  return null;
};

// `Returned to the pool: PAY-7, PAY-9` in a closed sprint's `## Outcome` block - the ids
// sprint-close says went back to the backlog. The clash check above only ever notices an id
// in *two* places; it cannot notice one that ended up in *zero*, because a name in prose
// that nothing points back to just looks like nothing was checked.
const RETURNED_LINE = /^returned to the pool\s*:\s*(.*)$/i;
const returnedIdsIn = (file) => {
  const ids = [];
  for (const { heading, text } of lines(file)) {
    if (heading === null || !OUTCOME.test(heading)) continue;
    const m = text.match(RETURNED_LINE);
    if (!m) continue;
    for (const tok of m[1].split(",")) {
      const id = unwrap(tok);
      if (ID.test(id)) ids.push(id);
    }
  }
  return ids;
};

// The pool's `## In flight` table: which sprint each team is running, and how many intents it
// holds. `/sprint-open` writes a row and `/sprint-close` removes it, so a row naming a closed
// sprint is a pointer nobody removed and a count disagreeing with the sprint's real rows is
// the pool describing work it cannot see. Both read as a perfectly tidy pool.
//
// A markdown link (`[august](sprints/x/august.md)`) and a bare or backticked path are both in
// use in the wild, so the target is taken from the link when there is one.
const LINK_TARGET = /\[[^\]]*\]\(([^)]+)\)/;
const POINTER_COLUMNS = ["sprint", "team", "goal", "target", "items"];
const pointerRows = (file) => {
  const rows = [];
  const unreadable = [];
  let headerCells = null;
  let cols = null;
  for (const { heading, text } of lines(file)) {
    if (heading === null || !IN_FLIGHT.test(heading)) continue;
    const cells = cellsOf(text);
    if (cells === null) {
      headerCells = null;
      cols = null;
      continue;
    }
    if (cells.length && cells.every((c) => SEP_CELL.test(c))) {
      const found = Object.fromEntries(POINTER_COLUMNS.map((n) => [n, columnNamed(headerCells, n)]));
      // The pointer table is recognised by its columns, not by being the first table under
      // the heading: a pool is free to write anything else here, and reading an intent table
      // as a broken pointer table would fail a repo doing nothing wrong. Naming *some* of
      // the columns and not `sprint` is the case worth reporting - that is the shape a rename
      // leaves behind, and it would otherwise switch this whole check off in silence.
      cols = POINTER_COLUMNS.some((n) => found[n] >= 0) ? found : null;
      continue;
    }
    if (headerCells === null) {
      headerCells = cells;
      continue;
    }
    if (cells.every((c) => c === "")) continue; // the template's blank row
    if (cols === null) continue;
    const { sprint: cycleCol, team: teamCol, items: itemsCol } = cols;
    if (cycleCol < 0) {
      unreadable.push(text);
      continue;
    }
    const raw = cells[cycleCol] ?? "";
    const path = unwrap(LINK_TARGET.exec(raw)?.[1] ?? raw);
    if (!path) {
      // A half-written row - a team in flight with no sprint named. Skipping it would make
      // blanking one cell the way to stop a pointer being checked.
      unreadable.push(text);
      continue;
    }
    rows.push({
      team: unwrap(teamCol >= 0 ? (cells[teamCol] ?? "") : "") || "a team",
      path,
      items: unwrap(itemsCol >= 0 ? (cells[itemsCol] ?? "") : ""),
    });
  }
  return { rows, unreadable };
};

const pool = POOLS.find(existsSync);
const cycleFiles = existsSync(CYCLES) ? walk(CYCLES) : [];

// No sprints means the one-place invariant has nothing to check - but the pool's blocks
// still do, and a stale block costs a core-profile repo exactly what it costs a scale one:
// a row that sits there looking legitimately stuck. Exiting here would have skipped it.
if (!cycleFiles.length && !pool) {
  console.log(`sprint-guard: no sprint files under ${CYCLES}/ and no backlog - nothing to check`);
  process.exit(0);
}

// Sprints exist and the pool does not: the half of the invariant this guard exists for
// cannot be checked, and printing OK would claim that it was.
if (!pool) {
  console.error(`  ${cycleFiles.length} sprint file(s) but no backlog at ${POOLS.join(" or ")}`);
  console.error("\nsprint-guard: the pool half of the invariant cannot be checked without a backlog.");
  process.exit(block ? 1 : 0);
}

const files = [pool, ...cycleFiles];
const where = new Map(); // id -> [file, ...]
const status = new Map(); // id -> last status cell seen
const work = new Map(); // normalized title -> [{ id, file, title }, ...]
const rowCount = new Map(); // sprint file -> how many intent rows it holds
const blocks = []; // { id, ref, file }
const splits = []; // { id, ref, file }
const unreadable = []; // { file, why } - a sprint this guard cannot read at all
for (const f of files) {
  const { rows, sawSection, bodyRows } = scan(f, f === pool ? null : INTENTS);
  // A sprint whose intents this guard cannot find is not a clean sprint, and the two look
  // identical from the outside. A real pool-plus-sprint duplicate was reported as
  // "OK - each in exactly one" for exactly this reason.
  if (f !== pool) {
    rowCount.set(f, rows.length);
    if (!sawSection) {
      unreadable.push({ file: f, why: "no `## Intents` heading - a sprint's rows live under that exact H2 (a deeper level does not count), because a closed sprint's `## Outcome` table names the same ids" });
    } else if (bodyRows > 0 && rows.length === 0) {
      unreadable.push({ file: f, why: `${bodyRows} row(s) under \`## Intents\` but no intent id in the first cell - the id is its own cell (\`PAY-2\`), the title goes in the next one` });
    }
  }
  const seenHere = new Set();
  for (const { id, title, status: s } of rows) {
    where.set(id, [...(where.get(id) ?? []), f]);
    status.set(id, s);
    const key = asWork(title);
    // Once per id per file: the invariant is about places, and a file that repeats a row
    // is not two teams holding the same work.
    if (key && !seenHere.has(`${key} ${id}`)) {
      seenHere.add(`${key} ${id}`);
      work.set(key, [...(work.get(key) ?? []), { id, file: f, title: title.trim() }]);
    }
    const b = s.match(BLOCKED_BY);
    if (b) blocks.push({ id, ref: b[1], file: f });
    const sp = s.match(SPLIT_AS);
    if (sp) splits.push({ id, ref: sp[1], file: f });
  }
}

// A reference is resolved to the row it names without regard to case, and reported using
// the spelling the row itself declares. `ADR-auth` and `INV-2b` are documented id shapes,
// so neither "the reference is compared verbatim" nor "the reference is uppercased" works:
// the first fails a typo the author cannot see, the second failed `ADR-auth` outright.
const declared = new Map();
for (const id of where.keys()) if (!declared.has(id.toLowerCase())) declared.set(id.toLowerCase(), id);
const resolve = (ref) => declared.get(ref.toLowerCase()) ?? null;
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

const clashes = [...where.entries()].filter(([, fs]) => fs.length > 1);

// The same work in two places under two ids. The clash check above keys entirely on the id,
// so copying an intent into a sprint and renumbering the pool copy satisfies it perfectly -
// the invariant is about the intent, and the id is only how it is usually spelled.
//
// A split is the one legitimate way one title reaches two rows: `split:<new-id>` names the
// row cut for the remainder, and an author who keeps the title is doing what the skill told
// them to. That pair is exempt; a third row carrying the same title is not.
const splitPairs = new Set(splits.flatMap(({ id, ref }) => [`${id} ${resolve(ref) ?? ref}`, `${resolve(ref) ?? ref} ${id}`]));
const duplicatedWork = [];
for (const rows of work.values()) {
  const ids = [...new Set(rows.map((r) => r.id))];
  if (new Set(rows.map((r) => r.file)).size < 2 || ids.length < 2) continue;
  if (ids.length === 2 && splitPairs.has(`${ids[0]} ${ids[1]}`)) continue;
  duplicatedWork.push(rows);
}

// A block naming an intent that no longer exists, or one already finished, is a block that
// has stopped applying - and nobody notices, because the row simply sits there looking
// legitimately stuck. This is the only failure in the pair that costs time silently.
const splitInto = (id) => SPLIT_AS.exec(status.get(id) ?? "")?.[1] ?? null;
const finished = (id) => status.get(id)?.toLowerCase() === "done" || splitInto(id) !== null;
const stale = blocks.filter(({ ref }) => resolve(ref) === null || finished(resolve(ref)));
const selfBlocked = blocks.filter(({ id, ref }) => same(id, ref));
const splitNowhere = splits.filter(({ ref }) => resolve(ref) === null);
const selfSplit = splits.filter(({ id, ref }) => same(id, ref));

// The "at least one" direction: an id a closed sprint says it returned, but which is not
// actually sitting in the pool - the outcome block asserted a move that never happened.
const poolIds = new Set(scan(pool).rows.map((r) => r.id));
const cycleStatus = new Map(cycleFiles.map((f) => [f, readCycleStatus(f)]));
const unreturned = [];
for (const f of cycleFiles) {
  if (cycleStatus.get(f) !== "closed") continue;
  for (const id of returnedIdsIn(f)) {
    if (!poolIds.has(id)) unreturned.push({ id, file: f });
  }
}

// The pool's in-flight pointers against the sprints they name.
const unreadableFiles = new Set(unreadable.map((u) => u.file));
const { rows: pointers, unreadable: unreadablePointers } = pointerRows(pool);
const poolDir = pool.includes("/") ? pool.slice(0, pool.lastIndexOf("/")) : "";
const resolvePointer = (p) => {
  const tries = [poolDir ? `${poolDir}/${p}` : p, p, `docs/${p}`].map((c) => c.replace(/^\.\//, ""));
  return { file: tries.find((c) => cycleFiles.includes(c)) ?? null, tries: [...new Set(tries)] };
};
const danglingPointer = [];
const stalePointer = [];
const wrongCount = [];
const unreadableCount = [];
const pointed = new Set();
for (const { team, path, items } of pointers) {
  const { file, tries } = resolvePointer(path);
  if (!file) {
    danglingPointer.push({ team, path, tries });
    continue;
  }
  pointed.add(file);
  if (cycleStatus.get(file) === "closed") {
    stalePointer.push({ team, file });
    continue; // a closed sprint's count is not the pool's business - the row should be gone
  }
  if (items === "") continue;
  // A sprint this guard already said it cannot read has no row count worth comparing against,
  // and "says 6, holds 0" would bury the message that actually explains it.
  if (unreadableFiles.has(file)) continue;
  const held = rowCount.get(file) ?? 0;
  // A cell that is not a bare number is reported as unreadable rather than as a mismatch:
  // `6 items` against a sprint holding 6 is not a wrong count, it is a cell nothing can
  // compare, and saying "holds 6 items item(s), but holds 6" would be worse than silence.
  if (!/^\d+$/.test(items)) unreadableCount.push({ team, file, items, held });
  else if (Number(items) !== held) wrongCount.push({ team, file, items, held });
}
// The other direction, and the reason removing every pointer row is not a way out: a pool
// that keeps this table must keep it whole. A pool that deleted the section (the template
// says a repo not running sprints should) has no table to be incomplete.
const unpointed = pointers.length
  ? cycleFiles.filter((f) => cycleStatus.get(f) === "open" && !pointed.has(f))
  : [];

for (const [id, fs] of clashes) {
  console.error(`  ${id} is in ${fs.length} places: ${fs.join(", ")}`);
}
for (const rows of duplicatedWork) {
  const at = rows.map((r) => `${r.id} (${r.file})`).join(", ");
  console.error(`  "${rows[0].title}" is one intent in ${new Set(rows.map((r) => r.file)).size} places under ${new Set(rows.map((r) => r.id)).size} ids: ${at}`);
}
for (const { id, ref, file } of stale) {
  const named = resolve(ref);
  const into = named ? splitInto(named) : null;
  const why = !named ? `${ref} exists nowhere` : into ? `${named} was split and ${into} carries what remains` : `${named} is done`;
  console.error(`  ${id} (${file}) is blocked by ${ref}, but ${why} - the block no longer applies`);
}
for (const { id, file } of selfBlocked) {
  console.error(`  ${id} (${file}) is blocked by itself`);
}
for (const { id, ref, file } of splitNowhere) {
  console.error(`  ${id} (${file}) was split into ${ref}, but ${ref} exists nowhere - the remainder was never cut`);
}
for (const { id, file } of selfSplit) {
  console.error(`  ${id} (${file}) was split into itself`);
}
for (const { file, why } of unreadable) {
  console.error(`  ${file}: ${why}`);
}
for (const { id, file } of unreturned) {
  console.error(`  ${file} says ${id} was returned to the pool, but ${id} is not in ${pool}`);
}
for (const text of unreadablePointers) {
  console.error(`  ${pool}: an in-flight row with no \`sprint\` column to read: ${text}`);
}
for (const { team, path, tries } of danglingPointer) {
  console.error(`  ${pool} says ${team} is running \`${path}\`, but no sprint file is there (tried ${tries.join(", ")})`);
}
for (const { team, file } of stalePointer) {
  console.error(`  ${pool} still points ${team} at ${file}, which is closed - closing a sprint removes its pointer row`);
}
for (const { team, file, items, held } of wrongCount) {
  console.error(`  ${pool} says ${team}'s sprint holds ${items} item(s), but ${file} holds ${held}`);
}
for (const { team, file, items, held } of unreadableCount) {
  console.error(`  ${pool}: ${team}'s \`Items\` cell reads \`${items}\` - it holds the count and nothing else (${file} holds ${held})`);
}
for (const f of unpointed) {
  console.error(`  ${f} is open, but no in-flight row in ${pool} points at it`);
}

const problems =
  clashes.length +
  duplicatedWork.length +
  stale.length +
  selfBlocked.length +
  splitNowhere.length +
  selfSplit.length +
  unreadable.length +
  unreturned.length +
  unreadablePointers.length +
  danglingPointer.length +
  stalePointer.length +
  wrongCount.length +
  unreadableCount.length +
  unpointed.length;

if (!problems) {
  const note = blocks.length ? `, ${blocks.length} live block(s)` : "";
  const scope = cycleFiles.length
    ? `${where.size} intent(s) across ${files.length} place(s), each in exactly one`
    : `${where.size} intent(s) in the pool, no sprints in use`;
  console.log(`sprint-guard: OK - ${scope}${note}`);
  process.exit(0);
}

const summary = [`\nsprint-guard: ${problems} problem(s).`];
if (clashes.length || duplicatedWork.length) {
  summary.push(
    `An intent belongs to the pool or to one sprint. Pulling one into a sprint removes its row from ${pool}; closing a sprint unfinished returns it.`,
  );
}
if (duplicatedWork.length) {
  summary.push("Two ids over one title is the same violation wearing a new number - move the row, do not copy it and renumber the copy.");
}
if (stale.length || selfBlocked.length) {
  summary.push("A `blocked:<id>` status must name an intent that exists, is not itself, and is neither `done` nor already split.");
}
if (splitNowhere.length || selfSplit.length) {
  summary.push("A `split:<id>` status must name the new row cut for the remainder - a different id, and one that exists (ADR-029).");
}
if (unreadable.length) {
  summary.push(
    "A sprint whose intents cannot be read is not a sprint with no problems: the format is the interface. Rows under `## Intents`, the id in its own first cell, the status in the last cell whatever columns sit between - see docs/tree/docs-sprints.md, and `docs/sprints/_template.md` for the shape a sprint starts from.",
  );
}
if (unreturned.length) {
  summary.push(`An id a closed sprint's outcome names as returned must actually be in ${pool} - write it back, or fix the outcome block.`);
}
if (unreadablePointers.length || danglingPointer.length || stalePointer.length || wrongCount.length || unreadableCount.length || unpointed.length) {
  summary.push(
    `The \`## In flight\` table in ${pool} is how the pool stays the single place to start reading: one row per open sprint, naming its file and how many intents it holds. \`/sprint-open\` writes the row and \`/sprint-close\` removes it. A table with no rows in it is a pool not running sprints and is not checked; a table missing one row is a pool that has lost track of a sprint, which is.`,
  );
}
console.error(summary.join("\n"));
process.exit(block ? 1 : 0);
