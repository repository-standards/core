# <Product> - architecture

> The technical "how it is **built**" doc - **structure and boundaries**, not
> behavior. Components, boundaries, data, integrations, runtime. Kept current.
> How the system *behaves* lives in the [capability specs](../specs/README.md);
> decisions (why) live in [ADRs](decision-records/adr/README.md).

## Overview

The system in one diagram plus a paragraph (Mermaid welcome).

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
