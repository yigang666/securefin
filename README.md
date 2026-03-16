# SecureFin

A production-grade financial transaction recording service that demonstrates a complete DevOps lifecycle: **secure CI/CD**, **GitOps deployment**, **Kubernetes hardening**, **observability-as-code**, and **infrastructure-as-code** — across three isolated environments.

> Built as a DevOps portfolio project. Every tool choice is documented with an ADR. Every security control is enforced in code.

---

## Technology Stack

| Layer | Tools |
|---|---|
| **Application** | Node.js 20, Express, pino (structured logging), prom-client (Prometheus) |
| **Testing** | Jest, supertest, hadolint, Helm lint |
| **Container** | Docker (multi-stage, multi-arch), GHCR |
| **Orchestration** | Kubernetes, Helm 3 |
| **CI/CD** | GitHub Actions (4-stage pipeline) |
| **GitOps** | ArgoCD ApplicationSet |
| **Security** | Trivy, cosign, gitleaks, CodeQL, SBOM (Syft), NetworkPolicy, SecurityContext |
| **Observability** | Prometheus, Grafana (dashboard-as-code), ServiceMonitor |
| **Infrastructure** | Terraform (namespaces, RBAC, quotas) |
| **Release** | Conventional Commits, semantic-release |

---

## Architecture Overview

```
┌─────────────────── GitHub ──────────────────────────────┐
│  Push → Actions: test → scan → build → (ArgoCD syncs)   │
│                                    ↓                     │
│                              ghcr.io image               │
└──────────────────────────────────────────────────────────┘
              ↑ ArgoCD polls Git repo
┌──────────── Kubernetes Cluster ─────────────────────────┐
│  ArgoCD  →  Helm release  →  Deployment (3 pods)         │
│                                    ↓                     │
│  nginx Ingress  →  Service (ClusterIP)  →  Pods          │
│                                    ↓                     │
│  Prometheus ←── ServiceMonitor  scrapes /metrics         │
│  Grafana    ←── ConfigMap dashboard (auto-imported)      │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Prerequisites: Node.js 20, Docker, kubectl, helm

make dev          # start API with hot-reload on :3000
make test         # run Jest test suite
make lint         # lint Dockerfile + Helm chart
make compose-up   # full local stack: API + Prometheus + Grafana
make help         # list all available targets
```

---

## Project Structure

```
SecureFin/
├── app/
│   ├── server.js           # Express API — 4 endpoints
│   ├── logger.js           # Structured pino logger
│   ├── metrics.js          # Prometheus registry + metrics
│   ├── server.test.js      # Jest integration tests (8 cases)
│   ├── package.json        # Dependencies + scripts
│   ├── Dockerfile          # Multi-stage, multi-arch, non-root
│   ├── .env.example        # Local env var template
│   └── .dockerignore
│
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml         # Production defaults
│   ├── values-dev.yaml     # Dev overrides
│   ├── values-staging.yaml # Staging overrides
│   └── templates/
│       ├── deployment.yaml     # Hardened SecurityContext, anti-affinity
│       ├── service.yaml        # ClusterIP
│       ├── ingress.yaml        # nginx, conditional TLS
│       ├── hpa.yaml            # Horizontal Pod Autoscaler
│       ├── pdb.yaml            # PodDisruptionBudget
│       ├── networkpolicy.yaml  # Default-deny NetworkPolicy
│       ├── serviceaccount.yaml # Dedicated SA, no token mount
│       ├── servicemonitor.yaml # Prometheus Operator scrape config
│       └── configmap-dashboard.yaml  # Grafana dashboard-as-code
│
├── .github/
│   ├── workflows/ci-cd.yml         # 4-stage pipeline
│   └── pull_request_template.md
│
├── gitops/
│   └── applicationset.yaml   # ArgoCD ApplicationSet (all 3 envs)
│
├── terraform/
│   ├── main.tf              # Provider config, S3 backend
│   ├── namespaces.tf        # K8s namespaces + pull secrets
│   ├── rbac.tf              # RBAC roles for CI/CD service accounts
│   ├── quotas.tf            # ResourceQuota + LimitRange per env
│   ├── variables.tf
│   └── outputs.tf
│
├── monitoring/
│   ├── prometheus.yml                            # Local scrape config
│   └── grafana/provisioning/datasources/         # Auto-provisioned datasource
│
├── docs/adr/
│   ├── 001-in-memory-store.md
│   ├── 002-helm-over-kustomize.md
│   └── 003-push-vs-pull-cicd.md
│
├── Makefile                 # Developer shortcuts
├── docker-compose.yml       # Local stack (API + Prometheus + Grafana)
├── .pre-commit-config.yaml  # Pre-commit hooks
├── .releaserc.json          # semantic-release config
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

---

## API Reference

### `GET /health`
Kubernetes liveness/readiness probe.
```json
{ "status": "ok", "uptime": 123.4 }
```

### `GET /metrics`
Prometheus metrics endpoint (scraped by ServiceMonitor).
Returns text/plain Prometheus exposition format including:
- `securefin_transactions_total{currency}` — transaction counter
- `securefin_http_request_duration_seconds` — latency histogram
- `securefin_node_*` — Node.js runtime metrics

### `POST /transactions`

**Request body:**
```json
{ "amount": 42.50, "currency": "USD", "description": "Coffee" }
```

| Field | Type | Required |
|---|---|---|
| `amount` | number > 0 | yes |
| `currency` | string (ISO 4217) | yes |
| `description` | string | no |

**Response `201`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 42.50,
  "currency": "USD",
  "description": "Coffee",
  "timestamp": "2026-03-17T10:00:00.000Z"
}
```

### `GET /transactions`

| Param | Default | Description |
|---|---|---|
| `currency` | — | Filter by currency (case-insensitive) |
| `limit` | 100 | Max results (capped at 500) |
| `offset` | 0 | Pagination offset |

---

## Local Development

### Option 1 — API only

```bash
cd app && npm install
make dev        # nodemon hot-reload
make test       # Jest tests
```

### Option 2 — Full stack (API + Prometheus + Grafana)

```bash
make compose-up
# API:        http://localhost:3000
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001  (admin/admin)
```

---

## CI/CD Pipeline

4 jobs run in sequence on every push to `dev`, `staging`, or `main`:

```
test  →  scan  →  build  →  deploy
```

| Job | What it does |
|---|---|
| **test** | Jest tests with `LOG_LEVEL=silent` |
| **scan** | hadolint, gitleaks, Helm lint, CodeQL, `dependency-review` (PRs) |
| **build** | Multi-arch Docker build (amd64+arm64), push to GHCR, cosign sign, SBOM, Trivy scan |
| **deploy** | `helm upgrade --install --atomic` to the matching K8s namespace |

PRs to `staging`/`main` run only **test** + **scan** (no deploy).

---

## GitOps with ArgoCD

The `gitops/applicationset.yaml` defines all three environments as a single ArgoCD ApplicationSet.

```bash
# Deploy ArgoCD ApplicationSet
kubectl apply -f gitops/applicationset.yaml -n argocd
```

| Environment | Auto-sync | Self-heal | Sync trigger |
|---|---|---|---|
| dev | ✅ | ❌ | Every push to `dev` |
| staging | ✅ | ✅ | Every push to `staging` |
| prod | ❌ | ✅ | Manual ArgoCD sync |

ArgoCD detects drift (manual `kubectl` edits) and reconciles the cluster back to Git state.

---

## Helm Deployment (manual)

```bash
# Dev
make deploy-dev

# Staging
make deploy-staging

# Production (5-second abort window)
make deploy-prod

# Or directly:
helm upgrade --install securefin ./helm \
  --namespace securefin-prod --create-namespace \
  -f helm/values.yaml \
  --set image.tag=<git-sha> \
  --atomic --wait
```

---

## Kubernetes Resources per Environment

| Resource | dev | staging | prod |
|---|---|---|---|
| Deployment replicas | 1 (fixed) | 2–5 (HPA) | 2–10 (HPA) |
| HPA | ❌ | ✅ | ✅ |
| PodDisruptionBudget | minAvailable: 0 | minAvailable: 1 | minAvailable: 1 |
| NetworkPolicy | ❌ | ✅ | ✅ |
| TLS | ❌ | ✅ | ✅ |
| ServiceMonitor | ❌ | ✅ | ✅ |
| Grafana Dashboard | ❌ | ✅ | ✅ |

---

## Security Controls

| Layer | Control |
|---|---|
| **Source code** | gitleaks (pre-commit + CI), CodeQL SAST |
| **Dependencies** | `dependency-review-action` on PRs |
| **Dockerfile** | hadolint linting in CI |
| **Container image** | Trivy CVE scan (blocks on HIGH/CRITICAL) |
| **Supply chain** | cosign keyless signing; SBOM (SPDX) on every release |
| **Container runtime** | Non-root user (UID 1000), `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, all capabilities dropped |
| **Kubernetes** | NetworkPolicy (default-deny), dedicated ServiceAccount, `automountServiceAccountToken: false`, Pod Security Standards (restricted) |
| **Infrastructure** | Least-privilege RBAC via Terraform; per-namespace ResourceQuota |

---

## Observability

Every pod exposes `GET /metrics` (Prometheus format).

The Helm chart deploys:
- **ServiceMonitor** — tells Prometheus Operator to scrape `/metrics` every 30s
- **Grafana ConfigMap** — dashboard auto-imported by the Grafana sidecar

Pre-built dashboard panels:
- Transactions per minute (by currency)
- Total transaction count
- HTTP request latency p99
- Error rate (4xx/5xx)

Structured JSON logs (pino) are written to stdout and can be shipped to Loki/Elasticsearch via a sidecar or DaemonSet log collector.

---

## Infrastructure with Terraform

```bash
make tf-init    # download providers
make tf-plan    # preview changes
make tf-apply   # provision namespaces, RBAC, quotas
```

Terraform provisions:
- Three K8s namespaces with Pod Security Standards labels
- GHCR image pull secrets per namespace
- CI/CD `ServiceAccount` + `Role` + `RoleBinding` per namespace
- `ResourceQuota` and `LimitRange` per namespace

---

## GitHub Secrets Required

| Secret | Used in | How to generate |
|---|---|---|
| `GHCR_TOKEN` | build job | GitHub PAT with `packages:write` |
| `KUBECONFIG_DEV` | deploy job | `cat ~/.kube/config \| base64` |
| `KUBECONFIG_STAGING` | deploy job | `cat ~/.kube/config \| base64` |
| `KUBECONFIG_PROD` | deploy job | `cat ~/.kube/config \| base64` |

---

## Architecture Decision Records

Design decisions are documented in `docs/adr/`:

| ADR | Decision |
|---|---|
| [001](docs/adr/001-in-memory-store.md) | In-memory store for MVP; migration path to PostgreSQL |
| [002](docs/adr/002-helm-over-kustomize.md) | Helm over Kustomize for environment parametrisation |
| [003](docs/adr/003-push-vs-pull-cicd.md) | Push-based build pipeline + pull-based GitOps deployment |

---

## Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
# Hooks: trailing-whitespace, gitleaks, hadolint, helmlint, terraform_fmt
```

---

## Conventional Commits & Releases

Commit format: `<type>(<scope>): <description>`

```
feat(api): add DELETE /transactions/:id endpoint
fix(helm): correct resource limit units
ci: add ARM64 build target
```

`semantic-release` runs on merge to `main` and automatically:
- Bumps version (semver)
- Generates `CHANGELOG.md`
- Creates GitHub Release with SBOM attached

---

## .claude/ — AI Development State

| File | Purpose |
|---|---|
| `.claude/state/current.md` | Active task, last step, next action |
| `.claude/architecture/overview.md` | System design and decisions |
| `.claude/checkpoints/*.md` | Milestone snapshots |

Claude Code reads these at session start to resume work without context loss.
