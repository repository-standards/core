#!/usr/bin/env node
// Every skill this repo ships is a conforming Agent Skill, and stays one.
//
// ATTRIBUTIONS.md claims conformance to the Agent Skills open format
// (https://agentskills.io/specification). A claim a reader can check is only worth
// making if something here checks it too - otherwise the first skill written after
// the claim is the one that quietly breaks it.
//
// Two kinds of finding, deliberately not the same severity:
//   - the spec's REQUIREMENTS (frontmatter shape, name, description) fail outright;
//   - the spec's RECOMMENDED instruction budget is a ratchet. Three skills are over
//     it today (SKILL-BUDGET-1). Failing on them would mean either blocking every PR
//     or waiving the rule, so instead the overrun is recorded below and may only
//     shrink: a listed skill that grows fails, an unlisted skill that goes over
//     fails, and a listed skill that comes back inside the budget fails until its
//     line is deleted - a stale allowance is how a ratchet slips.
//
// Usage: node tools/skill-format-check.mjs [--self]

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// Where this repo keeps skills. Both classes (ADR-009): the shipped lifecycle set and
// the transition router that never ships.
const SKILL_ROOTS = ['standard/.claude/skills', 'skills'];

// https://agentskills.io/specification - the complete set of frontmatter keys the
// format defines. Anything else is a key some client invented, and it does not travel.
const SPEC_KEYS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_COMPATIBILITY = 500;

// The spec's recommendation, and the estimator behind the token figure. Four characters
// per token is coarse; it is named here so the number is reproducible rather than
// authoritative, and so a later change of estimator is a visible diff.
const MAX_LINES = 500;
const MAX_TOKENS = 5000;
const CHARS_PER_TOKEN = 4;

// Measured 2026-08-19. Each entry is a ceiling, not a permission: the value is what the
// file was when it was granted, and the check fails the moment it is exceeded.
const KNOWN_OVER = {
  'standard/.claude/skills/spec-specify': { lines: 364, tokens: 6881 },
  'standard/.claude/skills/spec-clarify': { lines: 285, tokens: 5397 },
};

function findSkills(repo, roots) {
  const found = [];
  for (const root of roots) {
    const abs = join(repo, root);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(abs, entry.name, 'SKILL.md');
      if (existsSync(file)) found.push({ id: `${root}/${entry.name}`, dir: entry.name, file });
    }
  }
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

// Enough YAML for a frontmatter block that the format keeps flat: top-level keys, and
// the nested map `metadata` may hold. A full parser would buy nothing here and would
// have to be pinned, reviewed and kept.
function frontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return null;
  const keys = [];
  const values = {};
  let current = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const top = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (top && !/^\s/.test(line)) {
      current = top[1];
      keys.push(current);
      values[current] = top[2];
      continue;
    }
    // A continuation line: folded scalars and nested maps both land here.
    if (current) values[current] = `${values[current]}\n${line.trim()}`.trim();
  }
  return { keys, values };
}

function unquote(v) {
  const s = (v ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  // Block scalars (`>`/`|`) keep their body, not their indicator.
  if (/^[>|][-+0-9]*\n/.test(s)) return s.replace(/^[>|][-+0-9]*\n/, '');
  return s;
}

export function check(repo, roots = SKILL_ROOTS, known = KNOWN_OVER) {
  const problems = [];
  const skills = findSkills(repo, roots);
  const seenAllowance = new Set();

  for (const skill of skills) {
    const src = readFileSync(skill.file, 'utf8');
    const fm = frontmatter(src);
    if (!fm) {
      problems.push(`${skill.id}: no YAML frontmatter - the format requires a --- block before the instructions`);
      continue;
    }

    const stray = fm.keys.filter((k) => !SPEC_KEYS.has(k));
    if (stray.length) {
      problems.push(`${skill.id}: frontmatter key(s) the format does not define: ${stray.join(', ')} - such a key does not travel to another client`);
    }

    const name = unquote(fm.values.name);
    if (!name) problems.push(`${skill.id}: no name - the format requires one`);
    else {
      if (name.length > MAX_NAME) problems.push(`${skill.id}: name is ${name.length} characters, over the ${MAX_NAME}-character limit`);
      if (!NAME_RE.test(name)) problems.push(`${skill.id}: name "${name}" is outside the format's character set - lowercase letters, digits and single hyphens, never leading, trailing or doubled`);
      if (name !== skill.dir) problems.push(`${skill.id}: name "${name}" does not match its directory "${skill.dir}" - the format requires them identical`);
    }

    const description = unquote(fm.values.description);
    if (!description) problems.push(`${skill.id}: no description - it carries the entire trigger, and a client that cannot read one skips the skill`);
    else if (description.length > MAX_DESCRIPTION) problems.push(`${skill.id}: description is ${description.length} characters, over the ${MAX_DESCRIPTION}-character limit`);

    if (fm.keys.includes('compatibility')) {
      const compatibility = unquote(fm.values.compatibility);
      if (compatibility.length > MAX_COMPATIBILITY) problems.push(`${skill.id}: compatibility is ${compatibility.length} characters, over the ${MAX_COMPATIBILITY}-character limit`);
    }

    const lines = src.split(/\r?\n/).length;
    const tokens = Math.round(src.length / CHARS_PER_TOKEN);
    const allowance = known[skill.id];
    const over = lines > MAX_LINES || tokens > MAX_TOKENS;

    if (allowance) {
      seenAllowance.add(skill.id);
      if (!over) {
        problems.push(`${skill.id}: back inside the instruction budget (${lines} lines, ~${tokens} tokens) - delete its line from KNOWN_OVER, a spent allowance is how the ratchet slips`);
      } else if (lines > allowance.lines || tokens > allowance.tokens) {
        problems.push(`${skill.id}: grew past its recorded overrun - ${lines} lines / ~${tokens} tokens against ${allowance.lines} / ~${allowance.tokens}. The allowance may shrink, never grow`);
      }
    } else if (over) {
      problems.push(`${skill.id}: ${lines} lines, ~${tokens} tokens - over the format's recommended ${MAX_LINES} lines and ${MAX_TOKENS} tokens, which load whole on every activation. Move the overflow into sibling files the SKILL.md loads by name and condition`);
    }
  }

  for (const id of Object.keys(known)) {
    if (!seenAllowance.has(id)) problems.push(`KNOWN_OVER names ${id}, which is not a skill in this repo - delete the line`);
  }

  return { skills, problems };
}

function selfTest() {
  const root = join(tmpdir(), `skill-format-check-self-${process.pid}`);
  const cases = [];
  const write = (dir, body) => {
    mkdirSync(join(root, 'skills', dir), { recursive: true });
    writeFileSync(join(root, 'skills', dir, 'SKILL.md'), body);
  };
  const good = (name, extra = '', body = 'Do the thing.') =>
    `---\nname: ${name}\ndescription: Use when the thing needs doing.${extra ? `\n${extra}` : ''}\n---\n\n${body}\n`;

  rmSync(root, { recursive: true, force: true });
  write('fine', good('fine'));
  write('mismatched', good('other-name'));
  write('shouty', good('Shouty'));
  write('doubled', good('doub--led'));
  write('no-description', '---\nname: no-description\n---\n\nBody.\n');
  write('long-description', good('long-description').replace('Use when the thing needs doing.', 'x'.repeat(MAX_DESCRIPTION + 1)));
  write('invented-key', good('invented-key', 'trigger: always'));
  write('no-frontmatter', '# just a heading\n');
  write('too-long', good('too-long', '', 'x'.repeat(MAX_TOKENS * CHARS_PER_TOKEN + 100)));

  const { problems } = check(root, ['skills'], { 'skills/absent': { lines: 1, tokens: 1 } });
  const hits = (needle) => problems.filter((p) => p.includes(needle));

  const expect = (label, ok) => cases.push({ label, ok });
  expect('a conforming skill raises nothing', hits('skills/fine').length === 0);
  expect('a name that is not its directory fails', hits('skills/mismatched').some((p) => p.includes('does not match its directory')));
  expect('an uppercase name fails', hits('skills/shouty').some((p) => p.includes('character set')));
  expect('a doubled hyphen fails', hits('skills/doubled').some((p) => p.includes('character set')));
  expect('a missing description fails', hits('skills/no-description').some((p) => p.includes('no description')));
  expect('an over-long description fails', hits('skills/long-description').some((p) => p.includes('over the 1024-character limit')));
  expect('a frontmatter key the format does not define fails', hits('skills/invented-key').some((p) => p.includes('does not define')));
  expect('a file with no frontmatter fails', hits('skills/no-frontmatter').some((p) => p.includes('no YAML frontmatter')));
  expect('an unlisted skill over the budget fails', hits('skills/too-long').some((p) => p.includes('recommended 500 lines')));
  expect('a stale allowance fails', hits('skills/absent').some((p) => p.includes('delete the line')));

  // The ratchet only bites in one direction: record the overrun and it passes, record
  // a smaller one and it fails.
  const atCeiling = check(root, ['skills'], { 'skills/too-long': { lines: 12, tokens: 20100 } });
  expect('a recorded overrun passes', atCeiling.problems.filter((p) => p.includes('skills/too-long')).length === 0);
  const grown = check(root, ['skills'], { 'skills/too-long': { lines: 12, tokens: 5001 } });
  expect('growth past the recorded overrun fails', grown.problems.some((p) => p.includes('may shrink, never grow')));

  rmSync(root, { recursive: true, force: true });

  const failed = cases.filter((c) => !c.ok);
  for (const c of cases) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'}  ${c.label}`);
  if (failed.length) {
    console.error(`\nskill-format-check --self: FAIL - ${failed.length} case(s)`);
    process.exit(1);
  }
  console.log(`\nskill-format-check --self: OK - ${cases.length} cases`);
}

if (process.argv.includes('--self')) {
  selfTest();
} else {
  const { skills, problems } = check(REPO);
  if (problems.length) {
    console.error('skill-format-check: the shipped skills no longer match the format ATTRIBUTIONS.md claims:');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('\nThe format: https://agentskills.io/specification');
    process.exit(1);
  }
  const allowed = Object.keys(KNOWN_OVER).length;
  console.log(`skill-format-check: OK - ${skills.length} skill(s) conform; ${allowed} carry a recorded instruction-budget overrun that may only shrink`);
}
