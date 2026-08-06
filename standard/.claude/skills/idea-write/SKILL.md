---
name: idea-write
description: Use when someone floats something that might never ship - "what if we let hosts pre-approve repeat guests", "should we offer a paid tier", "I wonder whether we need multi-currency". Captures it end-to-end (including its provisional technical/business shape) in docs/ideas/ without minting a record or a spec, and moves it through idea -> exploring -> approved | parked | dropped as it firms up.
---

# idea-write

Someone is thinking out loud about something that might never happen. This gives that
first-class treatment - captured in the repo, not lost in chat - **without** pretending a
decision was made (R14, ADR-010). `adr-write` and `bdr-write` both refuse to write a record
for a maybe and point here instead; this is the skill that actually catches it.

## Is it an idea at all?

**A decision already made** is `adr-write`/`bdr-write`'s job, not this one - if the user is
telling you what was decided, not what they are wondering about, route there instead and say
so.

**A topic already accumulating real material** - meeting notes, mails, findings whose
provenance matters - is discovery, not an idea (`discovery-digest`, ADR-024). An idea is one
person's (or one conversation's) speculation; the moment it is being actively investigated
with sourced material, it graduates to a dossier even before anyone approves anything.

If in doubt, ask which: "is this a decision you've made, something you want investigated, or
still just a maybe?"

## New idea

1. **Slugify the title** (`repeat-guest-preapproval`, not a ticket name) and check
   `docs/ideas/` for an existing file first - do not fork a second doc for the same idea
   under a different name.

2. **Copy `docs/ideas/_template.md`** to `docs/ideas/<slug>.md`. Fill it from what the user
   said:
   - **The itch** - the problem or opportunity, one paragraph, plain language.
   - **For whom** - name the persona(s) from `docs/personas.md` this would serve. An idea
     that serves no persona is parked, not explored (ADR-006) - say so rather than filing it
     anyway.
   - **Provisional shape** - whatever the idea needs: business model, UX sketch, technical
     approach, pricing. Speculation is welcome here and nowhere else in the repo; nothing in
     this section is a decision.
   - **Open questions** - the unknowns that decide approve vs. park vs. drop.

3. **Set `Status: idea`**, today's date, and an owner (who is weighing this - not necessarily
   who thought of it).

## Moving it along

The statuses are the whole lifecycle (ADR-010): `idea -> exploring -> approved | parked |
dropped`, and `approved` graduates into `graduated`.

- **`idea -> exploring`**: someone is actively working the open questions, not just holding
  the thought. Update the file in place - add what was learned, narrow the open questions.
- **`-> approved`**: the fork was taken - the idea is going to happen. **Do not stop here.**
  Hand off immediately: a backlog intent for the work (`add-to-backlog`), the spec change
  for what it alters (routed as below), and any ADR/BDR the shape now demands
  (`adr-write`/`bdr-write` - a decision now exists to write). Flip the idea doc's
  `Status` to `graduated` and fill the **Graduation** section with the backlog id, spec
  path, and record ids - the idea doc becomes the historical "here's how we got here," the
  new artifacts are where the work actually lives now.

  **Route the spec half through `spec-impact`, and let it name the capability.** An idea's
  slug names the idea, not a capability, so handing the slug to `spec-specify` mints
  `specs/<idea-slug>/` next to the capability the idea actually changes - two specs for one
  behaviour, the older one still stating the behaviour this idea replaced. An approved idea
  that changes how an **existing** capability works is `spec-update` against that
  capability's spec; `spec-specify` is for the case where the impact pass finds no existing
  capability owns the behaviour, and then the directory is named after the capability, never
  after the idea.
- **`-> parked`**: not now, not never. One line on why, so the next person who has the same
  thought finds this instead of re-arguing it from zero.
- **`-> dropped`**: decided against. One line on why - same reason: cheap memory beats a
  re-litigated conversation.

Never delete an idea doc. `parked`/`dropped` files are the record that the idea was
considered and what happened to it - that is the value, not the idea itself.

## Not this

- **Do not mint an ADR, BDR or spec for an idea that is not `approved`.** `Proposed` in a
  record means a decision is awaiting ratification, not that someone is still thinking about
  it - dressing speculation as a record implies a fork was taken when none was (R14).
- **Do not write only the itch and skip the provisional shape.** A one-line idea with no
  technical or business shape is not explored, it is a title - the template's "one place
  speculation is welcome" exists so the next conversation does not start from zero.
- **Do not leave an idea at `approved` without graduating it.** `approved` is a transition
  state, not a resting one - the moment it is confirmed, the handoff to backlog/spec/records
  is this skill's job to trigger, not something the next person has to notice is missing.

## Done When

- [ ] `docs/ideas/<slug>.md` exists, filled from what the user actually said
- [ ] `For whom` names a real persona, or the idea is marked `parked` instead
- [ ] `Status` reflects where it actually is, dated
- [ ] On approval: backlog intent + the spec change (the existing capability's spec where
      one owns the behaviour, a new capability only where none does) + any records exist,
      and the idea doc reads `graduated` with links to all three
- [ ] On park/drop: one line says why
