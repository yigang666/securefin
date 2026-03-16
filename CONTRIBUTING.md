# Contributing to SecureFin

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Semantic versioning and the CHANGELOG are generated automatically from commit messages.

```
<type>(<scope>): <description>

Types: feat | fix | docs | style | refactor | perf | test | chore | ci
```

Examples:
```
feat(api): add DELETE /transactions/:id endpoint
fix(helm): correct resource limit units in values-dev.yaml
docs(adr): add ADR for database migration strategy
ci: add ARM64 build target to Docker build matrix
```

Breaking changes: append `!` after type or add `BREAKING CHANGE:` in footer.
```
feat!: replace in-memory store with PostgreSQL
```

## Branch Strategy

| Branch | Purpose | Who merges |
|---|---|---|
| `feature/*` | New features and bug fixes | Developer → dev |
| `dev` | Integration and development testing | Auto-deploy to dev |
| `staging` | Pre-production QA | PR from dev, approved by lead |
| `main` | Production | PR from staging, approved by 2 reviewers |

## Pull Request Checklist

Before opening a PR:
- [ ] Tests pass locally (`make test`)
- [ ] Dockerfile lints clean (`make lint`)
- [ ] New features have test coverage
- [ ] ADR written for significant design decisions
- [ ] `make deploy-dev` tested locally if Helm changes are included

## Local Setup

```bash
git clone https://github.com/your-org/securefin
cd securefin
make dev          # start API with hot-reload
make compose-up   # start full stack (API + Prometheus + Grafana)
make test         # run test suite
```

## Code Style

- `'use strict'` at the top of every JS file
- Structured logging via `logger.js` — no bare `console.log`
- Prometheus metrics for any new business operation
- All new Helm values must have a comment explaining their purpose
