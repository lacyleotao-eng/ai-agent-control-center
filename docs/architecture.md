# Architecture

## Product boundary

The Community Edition is a local-first control plane for a small, human-approved agent collaboration loop. Its purpose is to make the handoff and evidence chain visible, not to run an autonomous software company.

## Runtime layers

```text
src/components + app pages
        |
        v
Next.js Route Handlers (/api/workflow, /api/dashboard, /api/audit)
        |
        v
Workflow Service
  - validates input
  - enforces state transitions
  - applies the Mock Planner template
  - writes audit evidence in the same transaction
        |
        v
Repository layer
        |
        v
Prisma Client -> local SQLite
```

Pages call services for server-rendered read models. Client components call Route Handlers for user actions and update their local snapshot. No page component imports Prisma directly.

## Minimal data model

| Model | Purpose |
| --- | --- |
| `Project` | Local workspace and ownership boundary. |
| `Requirement` | Human-created problem statement. |
| `Task` | Planner-created unit of work with a guarded status. |
| `Agent` | Seeded Planner, Developer, and QA roles. |
| `ApprovalRequest` | Human decision required before Developer receipt. |
| `WorkProduct` | Developer output and local evidence. |
| `Handoff` | Explicit transfer of a WorkProduct to QA. |
| `Review` | QA decision and evidence. |
| `AuditEvent` | Actor, object, previous state, new state, evidence, and timestamp. |

## Task state machine

```text
DRAFT
  -> APPROVED          (human approval)
  -> IN_PROGRESS       (Developer receives)
  -> WORK_PRODUCT_READY (Developer records WorkProduct)
  -> HANDED_OFF        (Developer sends to QA)
  -> IN_QA             (QA accepts Handoff)
  -> DONE              (QA submits APPROVED Review)
```

The Service rejects illegal transitions. A rejected action does not create a success audit event. The tests exercise both the valid path and illegal transitions.

## Mock Planner

`generate_task` uses a deterministic title and description template. It stores `plannerMode = MOCK_DETERMINISTIC` and creates a pending `ApprovalRequest`. It does not invoke a model, network, browser, repository, terminal, or external credential.

## Database setup

The checked-in migration is `prisma/migrations/0001_init/migration.sql`. `scripts/db-setup.mjs` first tries `prisma migrate deploy`. If the local Prisma engine returns the known empty schema-engine failure, it applies that same migration through `prisma db execute --schema --stdin` and runs the seed. The SQL uses idempotent table/index creation for safe local retries.

## Security boundary

The alpha is intended for localhost. It does not provide identity, authorization, remote database protection, secret management, external action adapters, or production deployment controls.
