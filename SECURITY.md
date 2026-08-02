# Security Policy

## Scope

This alpha is a local single-user demo. It is not designed for production secrets, multi-user access, or untrusted network exposure.

## Safe defaults

- No external API key is required.
- `.env` and local SQLite files are ignored by Git.
- The default Planner is deterministic and does not call a model.
- The workflow has an explicit human Approval Request before Developer work.
- No automatic code modification, deployment, merge, or push exists.

## Do not commit

Never commit API keys, access tokens, passwords, cookies, credentials, `.env` files, database files, logs, private project data, or screenshots containing private information.

Run the basic local scan before publishing:

```bash
pnpm security:scan
```

This scan is a lightweight release check, not a complete security audit, SAST system, dependency scanner, or compliance certification.

## Reporting

Please use a private GitHub security advisory for sensitive reports when the repository enables that feature. For non-sensitive issues, open a GitHub issue without including secrets or private data.

Until a maintainer confirms receipt, do not publish exploit details or reproduction data that contains credentials.
