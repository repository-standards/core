# Journeys - how each persona travels the product

<!-- PDLC-5. The poster problem: journey maps get made once and are never true again.
     Here the map is coupled to the capabilities that serve each stage, so a
     capability change has a named place to update. -->

One file per persona from [`_template.md`](_template.md), named after the persona
(`<persona-slug>.md`).

## You have this case - say this

**Nobody can say where a user actually enters the product.** That is the map missing,
not a workshop missing:

```
> map the host journey from first contact to first payout, stage by stage
```

**A stage hurts and you know it.** A pain with nowhere to go is a complaint; a pain in
the map is work:

```
> hosts drop out at identity verification - put it on the journey and file what it costs us
```

**A capability shipped or died.** The map is coupled to `specs/`, so it moves in the
same PR:

```
> pre-approval shipped - attach it to the booking stage of the guest journey
```

**Corner case - two personas, one screen.** Map the journeys separately even when the
UI is shared. A shared screen that serves two journeys is exactly where one persona
quietly gets the other's experience.

## The rules

- **Stages -> capabilities.** Every stage lists the `specs/<capability>` entries that
  serve it. A new capability slots into a stage; a retired one leaves it - in the same
  PR (the specs README coupling note points here).
- **Pains are backlog feeders:** a stage pain with no backlog item is either accepted
  (say so) or missing work.

## Index

| Persona | Journey |
|---|---|
| - | (none yet) |
