# Blog drafts

> Working doc (root, source-only, not shipped to `dist/`) - raw seeds and drafts for blog
> posts and long-form marketing. Different from `RELEASE-NOTES.md` (per-release, curated)
> and `PRODUCT.md` (the roadmap). Drop an idea here; polish later. Language follows the
> repo's language policy (default English); a draft may be in any language while it cooks.

---

## Draft: Specify, detail, build - forever

**Angle:** the day-to-day working model, and why it is a loop, not a pipeline.

Most "AI in the SDLC" stories draw a straight line: idea in, code out. Real product work is a
circle. Three roles keep passing one living spec around, and it never dead-ends:

- **PO / Product - Specify.** Shapes the product: vision, description, features - then
  sharpens each story into clear behavior and rules. Owns the *what* and the *why*, always
  for a named persona.
- **Architect + Dev - Detail.** Technical analysis: details each story and makes it
  *buildable* - the contracts, the implementation shape, and the decisions (ADR/BDR) that
  make it feasible.
- **AI - Build.** Turns the spec into a plan, asking the PO, architect and devs where it is
  unclear; then writes the tasks, builds and tests - and can grow and update the backlog
  itself.

Then it goes around again. The spec is the artifact that travels, gaining precision at each
hand-off; the AI never invents behavior or an unrecorded decision. That endless loop -
`specify -> detail -> build -> and around again` - is the whole working model, and it is the
signature of the landing page for a reason: continuous work, not a one-way pipe.

**Key line:** "It is a loop, not a pipeline - the spec is the truth that keeps going around."

---

## Draft: Drop into an old repo - plan first, refactor last

**Angle:** modernizing a repo that has fallen behind, without breaking what nobody documented.

The framework also has to walk into an **old** repo - one where everything needs bumping to
the newest versions - and plan how to raise the whole stack and keep it current. **But** the
order matters more than anything: first it makes a plan of the whole repo and records the
decisions - what and why - and only *then* does the refactor, once that knowledge exists.

So at the end of adoption there is a step - call it `modernize`, the "recommendation /
future" step - that is simply an analysis of the repo grounded in its ADRs, its specs, and
everything the earlier gates captured, deriving the best solutions and the migration paths to
new versions and technologies.

Why this order? Because bumping first and chasing the breakages loses behavior nobody
remembered was load-bearing - and records nothing. The hard rule: **understand -> record the
decisions -> then refactor.** The refactor becomes the execution of a recorded plan (small,
reversible, spec-guarded steps), plus a maintenance rhythm so the repo stays current instead
of rotting back.

**Key line:** "You cannot safely modernize what you have not first understood and written
down."

---

## Draft: Write in your own language (the AI reads it anyway)

**Angle:** language is a config now, not a constraint.

Teams used to write English docs they did not want to write, because tooling and hand-offs
assumed English. With an AI in the loop that overhead is gone: the model understands whatever
language you choose - you just have to *decide* and tell it. So the standard makes working
language a **configuration**: pick, per artifact, which language it uses. Recommended default
is English (widest collaboration, best library ecosystem), but a fully German team writing
German docs and English commits is a first-class setup, not a workaround.

**Key line:** "A German team should not write English docs out of habit - decide the
language, and the AI honors it."
