The questions a pull request has to answer before a reviewer reads a line of the diff: what
changed, why, what it makes untrue elsewhere, and how it was verified.

## What it is for

**So the reviewer spends their attention on the change rather than on reconstructing it.**
Most review time goes to working out what the author was trying to do. A template that
answers that up front converts it into review of the actual work.

It also makes the two easiest omissions visible: a decision that got made and not recorded,
and a spec that should have moved and did not.

## What goes in here

What and why. Which decision records this touches or creates. The test plan. The checklist
of gates that must be green.

The ADR line is the one that earns its place. A change forcing a contestable choice usually
makes it silently - the template asks in the one moment when the answer is still fresh and
the cost of writing it is a paragraph.

## What does not go in here

**A ceremony nobody reads.** A twenty-line checklist gets ticked wholesale. Each item should
be one somebody would actually stop for.

**Anything a guard already checks.** If CI proves it, the template asking about it is
theatre that trains people to tick without reading.

**A description of the diff.** The diff describes itself. The template is for what the diff
cannot say.

## Decisions behind it

- **`merge`, not `copy`.** Most repositories already have a template with things this
  standard has no opinion about; it contributes its questions rather than replacing yours.
- **Scale profile.** A solo repository reviewing its own pull requests gets the same value
  from `pre-pr-review`, which reads the diff with fresh context, without filling a form for
  an audience of one.
