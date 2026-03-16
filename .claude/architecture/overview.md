# Architecture Overview — SecureFin

## Purpose
SecureFin is a financial transaction recording service deployed on Kubernetes via Helm, with a fully automated multi-environment CI/CD pipeline on GitHub Actions.

## Modules

| Module | Path | Description |
|---|---|---|
| Transaction API | `app/server.js` | Express REST API — POST /transactions, GET /transactions |
| Container | `app/Dockerfile` | Node.js 20 Alpine image |
| Helm Chart | `helm/` | Kubernetes deployment manifests for all environments |
| CI/CD | `.github/workflows/ci-cd.yml` | GitHub Actions pipeline — lint → test → build → deploy |

## Environment Strategy

| Branch | Environment | Namespace | Description |
|---|---|---|---|
| `dev` | Development | `securefin-dev` | Auto-deploy on every push; loose resource limits |
| `staging` | Pre-production | `securefin-staging` | Deploy on PR to main; mirrors production config |
| `main` | Production | `securefin-prod` | Deploy on merge to main; requires manual approval |

## Key Design Decisions
- In-memory store for transactions (suitable for demo; replace with DB for production)
- Helm values split per environment (`values.yaml` base + `values-dev.yaml` / `values-staging.yaml` overrides)
- GitHub Actions uses environment secrets per branch for kubeconfig injection
- Ingress hostname per environment via Helm values override
