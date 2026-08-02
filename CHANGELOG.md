# Changelog

All notable changes to this project are documented here.

## [0.1.0-alpha] - 2026-08-02

### Added

- Independent Next.js, React, TypeScript, Prisma, SQLite, and pnpm community repository.
- Dashboard, Workflow, and Audit Trail pages.
- Minimal Project, Requirement, Task, Agent, ApprovalRequest, WorkProduct, Handoff, Review, and AuditEvent models.
- Deterministic Mock Planner with explicit non-model boundary.
- Human approval gate, Developer receipt, WorkProduct, QA handoff, QA acceptance, and review completion.
- Isolated workflow tests for valid and illegal state transitions.
- Basic secret/path scan and GitHub Actions CI.
- Open-source documentation, issue templates, pull request template, and MIT license.

### Known limitations

- Local single-user Alpha; not production ready.
- No real model invocation or autonomous orchestration.
- No authentication, external actions, background jobs, code edits, deployment, merge, or push.
