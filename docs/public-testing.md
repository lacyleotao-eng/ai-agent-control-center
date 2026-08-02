# Public installation testing

Thank you for testing AI Agent Control Center v0.1.0-alpha. This checklist is for fresh, local installations. The goal is to collect concrete installation, workflow, evidence, and documentation feedback without asking you to share private project data.

## Before you start

- Use a fresh clone of the public repository.
- Record your operating system and version.
- Record your Node.js version with `node --version`.
- Record your pnpm version with `pnpm --version`.
- Use a new local SQLite database for this test.
- Do not use production data, private repository data, API keys, tokens, cookies, passwords, or `.env` files from another project.

## Installation checklist

Run the documented setup:

```bash
git clone https://github.com/lacyleotao-eng/ai-agent-control-center.git
cd ai-agent-control-center
pnpm install
cp .env.example .env
pnpm db:setup
pnpm dev
```

Please record:

- Operating system:
- Node.js version:
- pnpm version:
- Repository commit or version tested:
- Did `pnpm install` complete successfully? `yes / no`
- Did `pnpm db:setup` complete successfully? `yes / no`
- Did the app start at `http://localhost:3000`? `yes / no`
- If a command failed, include the command and the relevant error text without secrets.

## Demo Workflow checklist

From the Workflow page, try the complete human-approved path:

1. Create a Requirement.
2. Generate a Task Draft with the deterministic Mock Planner.
3. Approve the task.
4. Let Developer receive the approved task.
5. Record a WorkProduct and evidence.
6. Create a Handoff and let QA accept it.
7. Submit a QA Review.
8. Open Audit Trail and confirm the actions, actors, state changes, evidence, and timestamps are understandable.

Please record:

- Did the complete Demo Workflow finish? `yes / no`
- Which step, if any, was unclear or blocked?
- Did the Audit Trail provide enough context to understand what happened?
- Did you encounter an unexpected state transition or error?

## Problems and suggestions

Please include:

- A short description of the problem.
- Minimal reproduction steps.
- Relevant browser and operating system details.
- The exact command output or UI error, with secrets removed.
- A screenshot only when it helps explain the problem. Redact names, paths, identifiers, and private data first.
- A concrete suggestion for improving installation, documentation, evidence, or audit usability.

## Privacy reminder

This is a public issue tracker. Never upload API keys, access tokens, cookies, passwords, private prompts, private project names, customer data, database files, `.env` files, or unredacted screenshots. If you believe you exposed a secret, stop sharing it and follow the reporting instructions in [`SECURITY.md`](../SECURITY.md).
