# Contributing

Thanks for helping improve the Community Edition.

## Development principles

- Keep the alpha local-first and easy to run.
- Preserve explicit human approval before Developer work.
- Keep Mock, manual, and real external execution clearly separated.
- Keep database access in Repository/Service code, not page components.
- Add an AuditEvent for every new state-changing workflow action.
- Prefer the smallest change that completes the requested behavior.

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm db:setup
```

## Before opening a pull request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm security:scan
pnpm build
```

For workflow changes, update the relevant documentation and include the state-transition and illegal-transition tests.

## Pull requests

Describe:

- what changed and why;
- which human approval or audit boundary is affected;
- how the change was tested;
- any known limitation or follow-up.

Do not include secrets, local database files, private data, or screenshots containing private information.
