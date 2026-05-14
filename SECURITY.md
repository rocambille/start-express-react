# Security Policy

## Supported Versions

This project follows [Calendar Versioning](https://calver.org/) (`YYYY.MM.DD`).

This repository is a **GitHub template**: a project starter, similar to what a `create-*` CLI would generate. Users start their own project from a release snapshot, so there is no single "running version" to patch centrally.

The versioning scheme carries an explicit compatibility contract:

- **Within a month (`YYYY.MM.x`)**: only hotfixes and security patches — no breaking changes. Rebasing your project onto a newer same-month release is safe.
- **Across months (`YYYY.MM` → `YYYY.MM+1`)**: may include breaking changes. The upcoming release is tracked via an open PR merging `dev` into `main`, so changes are visible in advance.

Because each release is a clean git snapshot, users who started from an older release can always **diff two releases** to identify relevant fixes and cherry-pick them into their own project.

| Branch | Purpose |
| ------ | ------- |
| `main` | Current stable release — receives hotfixes and security patches during the month |
| `dev`  | Next month's release in progress — new features and breaking changes, tracked via an open PR |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues or discussions.**

If you discover a vulnerability, you can report it in one of two ways:

- **GitHub Private Security Advisory** (preferred): use the [Report a Vulnerability](../../security/advisories/new) button in the Security tab of this repository.
- **Email**: send details to [rocambille@gmail.com](mailto:rocambille@gmail.com) with the subject line `[SECURITY] <short description>`.

### What to include

To help investigate the issue efficiently, please provide:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Affected version(s)
- Any suggested mitigation, if you have one

### What to expect

- **Acknowledgement**: within 5 business days of your report.
- **Status update**: within 2 weeks, you will be told whether the vulnerability is accepted or declined.
- **Fix timeline**: accepted vulnerabilities will be patched in `main` as soon as possible, and included in the next monthly release at the latest.
- **Credit**: reporters will be credited in the release notes unless they prefer to remain anonymous.
