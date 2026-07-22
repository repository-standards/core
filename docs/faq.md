# FAQ - the questions every adopter asks

Short answers first, links to the long version. This file is the middle of the funnel:
the landing page hooks, the FAQ unblocks, the docs teach.

**Which model should drive the transition?**
The strongest you have, at the highest thinking setting - fewer iterations, fewer
errors. The judgment gates (decisions, spec-depth calls) are where model quality shows.
Details: [adoption - which model](../standard/docs/adoption.md).

**I only have a weaker model. Can it do this?**
Yes. The process is **re-runnable and lossless**: align resumes from measurement
(`self-verify`), what is done stays done, and every pass improves the repo. A weaker
model needs more passes and more of your attention at the judgment gates - but it
finishes the job. The falling drift number is your progress bar.

**My repo is years old and messy. Is it too late?**
No - brownfield is a first-class path: `assess -> align -> onboard`, in prioritized
waves, re-entered as many times as needed. A multi-year repo is not aligned in one PR
*by design*. Start: [adoption](../standard/docs/adoption.md).

**Do I need Jira or a paid tracker?**
No. The default posture is **GitHub Issues** (free, unlimited). Jira (free up to 10
users) and Linear (free tier) plug in as adapters behind the same one-way bridge.
The repo holds intents; the tracker holds execution state (ADR-010).

**I'm a solo developer. Isn't this enterprise ceremony?**
Adopt the **core profile**: what keeps knowledge alive (specs, records, backlog,
self-verify) without what coordinates people (bridges, curated release notes, CI
gates). Flip to the scale profile when the second regular contributor arrives -
a flag plus the measured delta (ADR-011): [adoption - profiles](../standard/docs/adoption.md).

**What if I disagree with one of the standard's picks?**
Deviate deliberately: record a local superseding decision (ADR-004) and note the
exception in the manifest so updates never silently overwrite it. The paved road is a
default, not a cage.

**How is this different from Spec Kit, OpenSpec, BMAD, or Backstage?**
Those give you a *workflow* or a *scaffold*. This gives your repo a **versioned
reference to true up to** - align, verify, drift as a number - plus a guided brownfield
transition. It builds *on* Spec Kit for the spec flow rather than replacing it.

**How do I know it worked?**
`node scripts/self-verify.mjs` - compliance is a number, asserted in CI, against the
version pinned in `.standards-version`. When the standard moves, `update-to-version`
applies the delta and self-verify proves it again.
