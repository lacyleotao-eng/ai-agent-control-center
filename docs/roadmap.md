# Roadmap

This roadmap is intentionally short. Each milestone requires a separate scope decision and must preserve the local, human-approved boundary.

## Next milestone: evidence depth

- Add structured evidence fields for commands, links, and reviewer notes.
- Add review history without overwriting prior decisions.
- Add a compact WorkProduct detail view.

## Following milestone: Planner interface

- Introduce a `Planner` interface with the deterministic implementation as the default.
- Keep external model adapters opt-in, read-only by default, and visibly labeled.
- Add contract tests that prove model absence does not break local setup.

## Later milestone: local identity

- Add optional local authentication.
- Associate audit actors with an authenticated user while retaining readable actor names.
- Add project-level isolation before any network exposure.

## Explicit non-goals for this Alpha

- Fully autonomous multi-agent orchestration.
- Automatic code editing, terminal execution, deployment, merge, or push.
- Production hosting, enterprise governance, or multi-tenant SaaS.
- Copying private project data or hidden runtime configuration into the public repository.
