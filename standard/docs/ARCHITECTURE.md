# <Product> - architecture

> The technical "how it is **built**" doc - **structure and boundaries**, not
> behavior. Components, boundaries, data, integrations, runtime. Kept current.
> How the system *behaves* lives in the [capability specs](../specs/);
> decisions (why) live in [ADRs](decision-records/adr/README.md).

## Overview

The system in one diagram plus a paragraph (Mermaid welcome).

## Diagrams - the C4 model

Diagram with **C4** (Simon Brown): work top-down, only as deep as the reader needs.

- **Context** (level 1) - the system as a box, its users (the [personas](personas.md)), and
  the external systems it talks to. Almost always worth drawing.
- **Container** (level 2) - the deployable/runnable units (web app, API, service, DB, queue)
  and how they communicate. The default working level for most repos.
- **Component** (level 3) - the major parts inside one container. Draw only where it earns
  its keep (a complex container).
- **Code** (level 4) - skip; the code and the [specs](../specs/) are the truth at
  that level.

Keep diagrams in Mermaid, in this file, versioned with the code - not in a wiki that rots.
One Context + the Container view is enough for most repos.

## Components

| Component | Responsibility | Stack |
|-----------|----------------|-------|
| ... | ... | ... |

## Boundaries and invariants

The architectural rules - what must not cross what (e.g. "app never calls the DB
directly", "no synchronous cross-service HTTP"). Link the ADRs that set each one.

## Data

Stores, who owns which tables, key entities, migration approach.

## Integrations

External systems / vendors and how we talk to them (protocols, auth, webhooks).

## Runtime and deploy

Hosting, environments, how it ships, key operational facts.

## Key decisions

Link the [ADRs](decision-records/adr/README.md) that shaped this architecture. Do
not restate them here - point.
