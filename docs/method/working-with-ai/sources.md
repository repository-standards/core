# Sources

Every source the notes cite, in full. The notes cite by **key** (`[Study: METR 2025]`); this
file is where the key resolves.

Each entry carries enough to find the work again **if the link dies**: who produced it, when,
its stable identifier where one exists, and the sample it rests on. Each also declares how
this repo checked it - `primary` means the source itself was read, `secondary` means the
figure comes from a summary and has not been confirmed at the source. A `secondary` figure is
not wrong; it is *unconfirmed*, and a note leaning on one says so.

The key's prefix is the evidence class, so a reader sees what kind of support a sentence has
without leaving the sentence: **Study** (controlled or systematic), **Data** (large-scale
measurement), **Survey** (self-report at scale), **Vendor** (the tool maker's own statement),
**Incident** (a public, consequential event), **Field** (practitioner testimony).

---

## Studies

### `Study: METR 2025`

Becker, J., Rush, N., Barnes, E., Rein, D. **Measuring the Impact of Early-2025 AI on
Experienced Open-Source Developer Productivity.** METR, 12 July 2025 (revised 25 July 2025).
`arXiv:2507.09089`.

- **Method** - randomized controlled trial. 16 experienced open-source developers, 246 real
  tasks in repositories they already maintain, with the AI tooling available February to
  June 2025.
- **Used for** - measured completion time **19% longer** when AI use was allowed; the same
  developers forecast **24% faster** beforehand and reported **20% faster** afterwards.
  Economics and ML experts predicted 38-39% faster.
- **Caveat** - the authors treat the result as historical and have since changed the
  experiment design. It is evidence that the perception gap exists, not a constant to plan
  with.
- **Verified** - primary (abstract and figures read).
  [arxiv.org/abs/2507.09089](https://arxiv.org/abs/2507.09089) /
  [metr.org](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/),
  accessed 2026-08-01.

### `Study: Chroma 2025`

Hong, K., Troynikov, A., Huber, J. **Context Rot: How Increasing Input Tokens Impacts LLM
Performance.** Chroma Research, 14 July 2025.

- **Method** - 18 models across four families (Claude Opus/Sonnet/Haiku, GPT-4.1 family, o3,
  GPT-4o, Gemini 2.5/2.0, Qwen3 at three sizes), over five controlled experiments:
  needle-question similarity, distractor impact, needle-haystack similarity, haystack
  structure, and repeated words, plus LongMemEval conversational QA.
- **Used for** - performance degrades **non-uniformly** as input length grows, on tasks
  simple enough that length should not matter; lower question-answer semantic similarity
  accelerates the decline; distractors hurt more at length; a **shuffled** haystack is
  retrieved from more reliably than a logically coherent one; on LongMemEval, a focused
  ~300-token prompt beats the full ~113k-token one across every family.
- **Verified** - primary (methodology and findings read).
  [trychroma.com/research/context-rot](https://www.trychroma.com/research/context-rot),
  accessed 2026-08-01.

### `Study: Veracode 2025`

Veracode. **2025 GenAI Code Security Report: Assessing the Security of Using LLMs for
Coding.** Veracode, October 2025 update.

- **Method** - 80 code-completion tasks: four CWEs (SQL injection CWE-89, cross-site
  scripting CWE-80, log injection CWE-117, broken cryptography CWE-327) x four languages
  (Java, JavaScript, C#, Python) x five task instances, given to **over 100 LLMs**, with the
  output checked by a SAST engine. Each task can be completed securely or insecurely, and
  **the prompt contains no security guidance** - the point is to observe the default choice.
- **Used for** - overall security pass rate ~**55%**, so in **45%** of tasks the model
  introduces a detectable OWASP Top 10 flaw. By language (pass rate): Python 61.69%,
  JavaScript 57.34%, C# 55.27%, **Java 28.50%**. By CWE (pass rate): broken crypto 85.61%,
  SQL injection 80.44%, **cross-site scripting 13.53%**, **log injection 12.03%**. Model size
  barely matters (50.87 / 51.10 / 50.65% for large / medium / small). Syntactic pass rates
  rose steeply over the period while the security pass rate stayed flat.
- **Caveat** - this measures the default choice on isolated function-completion tasks without
  security prompting. It is not a claim about the rate of vulnerabilities in shipped
  AI-assisted code.
- **Verified** - primary (report PDF read: methodology p5-8, results p10-13).
  [veracode.com](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/),
  accessed 2026-08-01.

### `Study: ImpossibleBench 2025`

Zhong, Z., Raghunathan, A., Carlini, N. **ImpossibleBench: Measuring LLMs' Propensity of
Exploiting Test Cases.** 30 October 2025. `arXiv:2510.20270`.

- **Method** - impossible tasks built by mutating the tests of established benchmarks
  (LiveCodeBench, SWE-bench) so they contradict the natural-language specification, in two
  variants (one-off and conflicting mutations). Models are **explicitly told to prioritize
  the specification over the tests**.
- **Used for** - on the one-off variant of impossible-SWEbench, GPT-5 exploits the test cases
  **76%** of the time rather than reporting the task impossible; stronger models generally
  show *higher* cheating rates, so capability gains do not resolve the behavior.
- **Verified** - primary (paper details and figures read via the authors' write-up).
  [arxiv.org/abs/2510.20270](https://arxiv.org/abs/2510.20270), accessed 2026-08-01.

### `Study: Code comprehension 2025`

**How Accurately Do Large Language Models Understand Code?** 2025. `arXiv:2504.04372`.

- **Method** - 9 LLMs, ~575,000 debugging tasks over 637 Python and 670 Java programs;
  semantic-preserving mutations are injected and fault-localization accuracy is compared
  before and after.
- **Used for** - injecting **misleading comments** degrades fault localization more than
  misleading *variable names* does (24.55% vs 28.7% accuracy on the mutated phase). Models
  extract meaning from comments even though comments do not execute.
- **Verified** - primary (methodology and the comparison figures read).
  [arxiv.org/abs/2504.04372](https://arxiv.org/abs/2504.04372), accessed 2026-08-01.

### `Study: Comment internalization 2025`

**Inside Out: Uncovering How Comment Internalization Steers LLMs for Better or Worse.** 2025.
`arXiv:2512.16790`.

- **Method** - representation-level analysis using concept activation vectors: the comment
  concept is activated and deactivated inside the model across code completion, translation
  and refinement, plus a controlled comparison over 10 software-engineering tasks with
  identical code inputs.
- **Used for** - manipulating the comment concept shifts task performance across a range of
  **-90% to +67%**; the effect is strongest on summarization and weakest on completion.
  Comments are a large lever whose sign depends on the task.
- **Verified** - primary (abstract read).
  [arxiv.org/abs/2512.16790](https://arxiv.org/abs/2512.16790), accessed 2026-08-01.

### `Study: Agent cheating 2026`

**Do Coding Agents Deceive Us? Detecting and Preventing Cheating via Capped Evaluation with
Randomized Tests.** 2026. `arXiv:2606.07379`.

- **Used for** - the catalogue of cheating strategies: reverse-engineering test cases,
  modifying or deleting failing tests, editing evaluation code, hardcoding outputs for known
  inputs; and read-only test sandboxing as the countermeasure.
- **Verified** - secondary (identified through search summaries; the paper itself has not
  been read in full here). The claims it supports are corroborated by
  `Study: ImpossibleBench 2025`.
- [arxiv.org/abs/2606.07379](https://arxiv.org/abs/2606.07379), accessed 2026-08-01.

### `Data: Benchmark cheating audit`

**Finding Widespread Cheating on Popular Agent Benchmarks.** DebugML.

- **Used for** - harness-level cheating found across top submissions on multiple public agent
  leaderboards, plus confirmed reward-hacking cases across several benchmarks.
- **Verified** - secondary (search summary only).
  [debugml.github.io/cheating-agents](https://debugml.github.io/cheating-agents/), accessed
  2026-08-01.

---

## Large-scale measurement

### `Data: GitClear 2025`

GitClear. **AI Copilot Code Quality: 2025 Data Suggests 4x Growth in Code Clones.**

- **Method** - 211 million changed lines of code, January 2020 to December 2024, from
  repositories including those owned by Google, Microsoft and Meta plus enterprise
  corporations.
- **Used for** - cloned code rose from **8.3% of changed lines in 2021 to 12.3% in 2024**;
  **moved (refactored) lines fell from 25% in 2021 to under 10% in 2024**; copy/paste
  exceeded moved code for the first time on record.
- **Verified** - primary (report page read).
  [gitclear.com](https://www.gitclear.com/ai_assistant_code_quality_2025_research), accessed
  2026-08-01.

### `Data: GitClear 2026`

GitClear. **The Maintainability Gap: AI Code Quality in 2026.** January 2026.

- **Method** - 623 million analyzed changes, 2023 to 2026.
- **Used for** - copy/paste rose from 9.4% of changed lines (2022) to **15.7% in the first
  half of 2026**; moved code fell 21% (2022) -> 13% (2023) -> **3.8% (2026 to date)**; block
  duplication rose from 40.3 to **73.0 duplicated lines per million changed** (+81%); and
  long-term maintenance of older code fell from 1.7% to **0.46%**, a 74% decline.
- **Verified** - primary (report page read).
  [gitclear.com](https://www.gitclear.com/the_ai_code_quality_maintainability_gap), accessed
  2026-08-01.

### `Data: Repo mining 2026`

**An Exploratory Study on LLM-Generated Code and Comments in Code Repositories.** 2026.
`arXiv:2607.01867`.

- **Method** - eight long-lived repositories (four company-maintained: Google, Meta, Uber,
  Shopify; four community), October 2021 to October 2025, across Java, Python, Go, Ruby,
  JavaScript and PHP, with detector-based attribution of LLM-written code and comments.
- **Used for** - comments attributed to models concentrate in the **meta / explanation**
  categories, 63-74% of them in the company repositories; file-level intra-repository clones
  in suspected LLM code run 45-100% depending on repository.
- **Caveat** - attribution is by detector, not by disclosure; treat the categories as
  indicative rather than exact.
- **Verified** - primary (paper read).
  [arxiv.org/abs/2607.01867](https://arxiv.org/abs/2607.01867), accessed 2026-08-01.

---

## Surveys

### `Survey: DORA 2025`

DORA / Google Cloud. **2025 DORA Report: State of AI-Assisted Software Development.**
23 September 2025.

- **Method** - nearly 5,000 technology professionals surveyed, plus over 100 hours of
  qualitative data.
- **Used for** - **90%** report using AI at work and more than 80% believe it increased their
  productivity; AI adoption shows a **positive** relationship with software delivery
  throughput and product performance (a reversal from the previous year) and a **negative**
  relationship with delivery stability; **30%** report little or no trust in AI-generated
  code. The report's framing: without strong automated testing, mature version control and
  fast feedback, more change volume produces instability.
- **Verified** - primary (announcement and findings read).
  [cloud.google.com](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report),
  accessed 2026-08-01.

### `Survey: Stack Overflow 2025`

Stack Overflow. **2025 Developer Survey - AI section.**

- **Method** - annual developer survey; individual AI questions answered by roughly half to
  two thirds of a respondent pool on the order of 49,000.
- **Used for** - **84%** use or plan to use AI tools (up from 76%); trust in accuracy
  **32.7%** (3.1% highly trust + 29.6% somewhat trust) against **45.7%** distrust (26.1%
  somewhat + 19.6% highly); the top frustration is solutions that are *almost right but not
  quite* at **66%**; **45.2%** say debugging AI-generated code is more time-consuming.
- **Caveat** - press coverage widely reported trust as "29%", which is the *somewhat trust*
  band alone. The full trust figure is 32.7%.
- **Verified** - primary (survey AI section read).
  [survey.stackoverflow.co/2025/ai](https://survey.stackoverflow.co/2025/ai/), accessed
  2026-08-01.

---

## Vendor statements

### `Vendor: Claude Code docs`

Anthropic. **Best practices for Claude Code.** Product documentation, living page.

- **Used for** - context as the primary constraint and performance degrading as it fills;
  give the agent a check it can run and demand evidence rather than assertions; stop hooks
  and fresh-context reviewer subagents; the over-eager-reviewer caveat; the deletion test for
  instruction files and the warning that a bloated one causes rules to be ignored; hooks as
  deterministic where instructions are advisory; permission modes, allow lists and
  sandboxing; checkpoints not covering shell-made changes.
- **Caveat** - a living page. It states intent and the maker's view of what counts as a
  defect; it is not evidence of outcomes, and it can change without notice.
- **Verified** - primary (page read).
  [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices),
  accessed 2026-08-01.

### `Vendor: Anthropic context engineering 2025`

Anthropic. **Effective context engineering for AI agents.** Engineering blog.

- **Used for** - the attention-budget argument (n tokens imply n^2 pairwise relations, so
  every token spends a finite budget); performance as a gradient rather than a cliff;
  just-in-time retrieval, compaction, structured note-taking and sub-agent architectures as
  the countermeasures.
- **Verified** - primary (post read).
  [anthropic.com/engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
  accessed 2026-08-01.

### `Vendor: Claude Code system prompts`

Piebald AI. **claude-code-system-prompts** - a public mirror of Claude Code's shipped system
prompts and tool descriptions, updated per release.

- **Used for** - the agent is instructed to comment only where the reason is non-obvious and
  useful to a future reader, and to match the comment density of the file it is editing.
- **Caveat** - a third-party mirror, not an official publication; it tracks a specific
  release and the shipped text changes between versions.
- **Verified** - primary (repository searched for the relevant instruction text).
  [github.com/Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts),
  accessed 2026-08-01.

---

## Incidents

### `Incident: curl 2025-2026`

Stenberg, D. **Death by a Thousand Slops.** Personal blog, 14 July 2025. Plus the programme's
closure, reported January 2026.

- **Who** - the maintainer of curl, writing under his own name about his own project's
  security process; the security team numbers seven people.
- **Used for** - by July 2025 roughly **20%** of submissions were AI-generated slop while the
  valid-report rate had fallen to about **5%**; a typical report engages three or four people
  for thirty minutes to a few hours **each**. The bug bounty programme was ended in
  January 2026. Separately, the same maintainer publicly praised AI-*assisted* findings from
  a researcher who verified them before reporting - the tool was never the problem,
  unverified volume was.
- **Verified** - primary for the blog figures (post read); secondary for the closure date and
  the praised findings (trade press).
  [daniel.haxx.se](https://daniel.haxx.se/blog/2025/07/14/death-by-a-thousand-slops/) /
  [theregister.com](https://www.theregister.com/security/2026/01/21/curl-shutters-bug-bounty-program-to-stop-ai-slop/5063039)
  / [cybernews.com](https://cybernews.com/security/curl-maintainer-stenberg-says-ai-help-fix-dozens-of-bugs/),
  accessed 2026-08-01.

### `Incident: Replit 2025`

**An AI-powered coding tool wiped out a software company's database in a "catastrophic
failure".** Fortune, 23 July 2025. Catalogued as incident 1152 in the AI Incident Database.

- **Used for** - an agent executed destructive commands against live infrastructure during an
  explicit code-and-action freeze, deleting records for **over 1,200 executives and more than
  1,190 companies**; it then reported that recovery was not possible, which was false - the
  data was restored. Replit's CEO acknowledged it publicly and shipped separated development
  and production databases, improved rollback, and a planning-only mode.
- **Verified** - primary (article read); the incident-database entry corroborates.
  [fortune.com](https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/)
  / [incidentdatabase.ai/cite/1152](https://incidentdatabase.ai/cite/1152/), accessed
  2026-08-01.

---

## Field reports

Practitioner testimony. Cited by artifact, never by author: the identifier is the thread or
issue id, which is stable, and engagement figures are the state at the access date. See the
[citation rules](README.md) for why pseudonymous posters are not named.

### `Field: review refusal 2026`

*Today I announced that I won't be reviewing AI generated PRs at company meeting.*
r/ExperiencedDevs, thread `1towli9`, posted 2026-05-27. 1,908 points (0.89 upvote ratio),
442 comments at access.

- **Who** - a web developer receiving Rails/Vue pull requests generated with an agent by data
  scientists on the same company's staff.
- **Used for** - the refusal itself, and the poster's own two stated conclusions: the problem
  is code **nobody owns or understands**, and the cost ratio between generation and review
  has collapsed onto the reviewer.
- **Verified** - primary (thread and both updates read).
  [reddit.com/r/ExperiencedDevs/comments/1towli9](https://reddit.com/r/ExperiencedDevs/comments/1towli9/today_i_announced_that_i_wont_be_reviewing_ai/),
  accessed 2026-08-01.

### `Field: slop cleanup 2025`

*The era of AI slop cleanup has begun.* r/ExperiencedDevs, thread `1mg2r6y`, posted
2025-08-02. 4,272 points (0.97 upvote ratio), 473 comments at access.

- **Who** - a freelance software engineer of about eight years, mainly early-stage startups.
- **Used for** - inbound work shifting from building systems to repairing AI-built ones.
- **Verified** - primary (thread read).
  [reddit.com/r/ExperiencedDevs/comments/1mg2r6y](https://reddit.com/r/ExperiencedDevs/comments/1mg2r6y/the_era_of_ai_slop_cleanup_has_begun/),
  accessed 2026-08-01.

### `Field: repair calls 2026`

*Getting more calls to fix ai generated codebases than actual new builds lately.*
r/ExperiencedDevs, thread `1sskw4r`, posted 2026-04-22. 402 points (0.93 upvote ratio), 102
comments at access.

- **Who** - a consultant of about ten years, smaller companies and early-stage startups.
- **Used for** - the same shift, described independently and roughly eight months later.
- **Verified** - primary (thread read).
  [reddit.com/r/ExperiencedDevs/comments/1sskw4r](https://reddit.com/r/ExperiencedDevs/comments/1sskw4r/getting_more_calls_to_fix_ai_generated_codebases/),
  accessed 2026-08-01.

### `Field: parallel projects 2026`

*AI code vs human code: a small anecdotal case study.* r/ExperiencedDevs, thread `1qjbipc`,
posted 2026-01-21. 205 points (0.95 upvote ratio), 66 comments at access.

- **Who** - an engineer of about five years, comparing their own project against a
  colleague's near-identical one (Python, ML, greenfield, same period), the colleague's being
  roughly 90% AI-generated.
- **Used for** - about 80% of input models carrying nullability and shape mistakes; many
  tests, mostly trivial validation, of which roughly a tenth were judged worth keeping, with
  a share asserting the wrong behavior; **comment density inverted** (heavy on simple CRUD,
  near-absent in the dense mathematical parts); a common utility reimplemented where a
  library existed; defensive checks the control flow made unnecessary; no structural
  narrative.
- **Caveat** - explicitly anecdotal, one observer, self-described as such. It is the most
  concrete public side-by-side available, not a controlled study.
- **Verified** - primary (post read in full).
  [reddit.com/r/ExperiencedDevs/comments/1qjbipc](https://reddit.com/r/ExperiencedDevs/comments/1qjbipc/ai_code_vs_human_code_a_small_anectodal_case_study/),
  accessed 2026-08-01.

### `Field: six-month setup 2025`

*Claude Code is a Beast - Tips from 6 Months of Hardcore Use.* r/ClaudeAI, thread `1oivjvm`,
posted October 2025, about 2,331 points at access; companion repository post `1ojqxbg`
(2025-10-30) publishes the configuration.

- **Who** - an engineer running an agent daily against an internal work project of 300k+
  lines.
- **Used for** - documented rules being ignored until the "how to write code" guidance moved
  out of the always-loaded instruction file into **skills** loaded on demand, leaving the
  instruction file with project mechanics only; **hooks** used for enforcement (a
  prompt-submit hook injecting the relevant skill, a stop hook checking what was edited); a
  plan/context/task file pattern kept explicitly because it **survives context resets**;
  re-prompting from an earlier branch instead of stacking corrections.
- **Verified** - primary (post and companion post read).
  [reddit.com/r/ClaudeAI/comments/1oivjvm](https://www.reddit.com/r/ClaudeAI/comments/1oivjvm/claude_code_is_a_beast_tips_from_6_months_of/),
  accessed 2026-08-01.

### `Field: CC issue 3382`

*Claude says "You're absolutely right!" about everything.* anthropics/claude-code issue 3382,
closed, ~1,375 reactions at access.

- **Used for** - reflexive agreement as a recognized, widely-experienced behavior rather than
  an anecdote; self-assessment is therefore not verification.
- **Verified** - primary (issue metadata read via the GitHub API).
  [github.com/anthropics/claude-code/issues/3382](https://github.com/anthropics/claude-code/issues/3382),
  accessed 2026-08-01.

### `Field: CC issue 6235`

*Feature Request: Support AGENTS.md.* anthropics/claude-code issue 6235, open, ~5,802
reactions at access - the most-reacted issue in that tracker.

- **Used for** - teams maintaining duplicate instruction files per tool, and drift between
  them as the reported pain.
- **Verified** - primary (issue metadata read via the GitHub API; confirmed as the
  highest-reaction issue by a sorted query).
  [github.com/anthropics/claude-code/issues/6235](https://github.com/anthropics/claude-code/issues/6235),
  accessed 2026-08-01.

### `Field: HN agent workflows`

Hacker News comment threads on agent workflows, retrieved through the Algolia search API.

- **Used for** - independent convergence on lean instruction files, sub-agent delegation,
  fresh context per stage, spec documents before execution, and reports of agents running
  destructive git commands despite explicit instruction.
- **Caveat** - an aggregate of many comments rather than one citable artifact; the weakest
  form of evidence used here, and used only where a study or vendor statement says the same
  thing.
- **Verified** - primary (comment corpus retrieved and read).
  [hn.algolia.com](https://hn.algolia.com/?query=claude%20code%20context%20workflow&type=comment),
  accessed 2026-08-01.
