# AI Agent Control Center

> A local-first control plane for human-approved and auditable AI agent collaboration.

`v0.1.0-alpha` is a small, runnable community edition for exploring one governed agent workflow on a local machine. It is intentionally **Alpha**, **local-first**, **human-approved**, and **not production ready**.

It is not Fully Autonomous, an Automatic Software Company, or a Zero Human Intervention system. The default Planner is a deterministic Mock Planner, and the UI makes that boundary visible.

![AI Agent Control Center dashboard](docs/screenshots/dashboard.png)

## What is included

- Seeded Demo Project with Planner, Developer, and QA agents.
- Requirement creation from the Workflow page.
- Deterministic Mock Planner that creates a Task Draft and Approval Request.
- Human approval gate before Developer can receive a task.
- Developer receipt and local WorkProduct recording.
- Handoff from Developer to QA, with explicit QA acceptance.
- QA Review that can complete the task.
- Audit Trail with actor, object, state transition, evidence, and timestamp.
- Local SQLite storage through Prisma; no external API key is required.

## Not included yet

- Real model calls or a production Planner Agent.
- Autonomous orchestration, automatic task decomposition, or background workers.
- Automatic code edits, terminal execution, deployment, merge, or push.
- Authentication, multi-user authorization, multi-tenant data, or cloud hosting.
- Production observability, compliance governance, or enterprise audit controls.

## Architecture

The alpha keeps the runtime deliberately small:

```text
React UI
  -> Next.js Route Handlers
    -> Workflow Service (validation + state transitions)
      -> Repository layer
        -> Prisma Client -> SQLite
```

Each state-changing action writes an `AuditEvent` in the same transaction as the workflow record. The complete data model is documented in [`docs/architecture.md`](docs/architecture.md).

## Local installation

Requirements: Node.js 20.9+, pnpm 10+ (pnpm 11 is supported), and Git.

```bash
git clone <repository-url>
cd ai-agent-control-center
pnpm install
cp .env.example .env
pnpm db:setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The seed creates a self-contained Demo Project. The `DATABASE_URL` default is `file:./dev.db`.

If the local Prisma migration engine is unavailable, `pnpm db:setup` reports the fallback and applies the same checked-in SQLite migration using `prisma db execute`. It does not connect to a remote database.

For a one-command local setup plus development server:

```bash
pnpm demo
```

## Demo workflow

1. Open **Workflow** and create a Requirement.
2. Select it and click **Generate task draft**.
3. Review the generated draft and click **Approve task**.
4. Let Developer receive the approved task.
5. Record a WorkProduct and its evidence.
6. Create the Handoff, then let QA accept it.
7. Submit an approved QA Review.
8. Open **Audit Trail** and inspect every recorded transition.

The full walkthrough, expected states, and troubleshooting notes are in [`docs/demo-workflow.md`](docs/demo-workflow.md).

## Mock Planner boundary

The Mock Planner uses a deterministic template based on the Requirement title and description. It creates a draft locally and records `plannerMode = MOCK_DETERMINISTIC`. It does not call a model, browse the web, read a repository, use an API key, or execute code.

## Common commands

```bash
pnpm dev              # Start local development
pnpm demo             # Initialize DB, seed Demo Project, start development
pnpm db:setup         # Generate Prisma Client, migrate, and seed
pnpm lint             # ESLint
pnpm typecheck        # TypeScript compiler
pnpm test             # Isolated workflow/state-transition test
pnpm security:scan    # Basic repository secret/path scan
pnpm build            # Production build
```

## Roadmap

The next milestones are bounded and confirmation-gated:

1. Add richer local WorkProduct evidence and review history.
2. Add a pluggable Planner interface while keeping Mock Planner as the safe default.
3. Add optional local authentication and project isolation.
4. Add a separately approved, read-only external model adapter.

See [`docs/roadmap.md`](docs/roadmap.md) for non-goals and sequencing.

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md). Keep changes small, preserve the human approval boundary, and include tests for every new state transition.

## Security

Never commit `.env`, database files, tokens, cookies, credentials, or private data. See [`SECURITY.md`](SECURITY.md) for the reporting and local-development policy.

## License

Released under the [MIT License](LICENSE).
