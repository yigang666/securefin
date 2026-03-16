# Architecture Overview — SecureFin

## Purpose
SecureFin is a production-grade financial transaction recording service that demonstrates a complete DevOps lifecycle: secure CI/CD, GitOps deployment, Kubernetes hardening, observability-as-code, and infrastructure-as-code across three isolated environments.

## Module Map

| Module | Path | Description |
|---|---|---|
| Transaction API | `app/server.js` | Express REST API — 4 endpoints |
| Structured Logger | `app/logger.js` | pino JSON logger |
| Metrics | `app/metrics.js` | Prometheus registry, counters, histograms |
| Container | `app/Dockerfile` | Multi-stage, multi-arch Node.js 20 Alpine |
| Helm Chart | `helm/` | 9 Kubernetes resource templates |
| CI/CD Pipeline | `.github/workflows/ci-cd.yml` | 4-stage: test → scan → build → deploy |
| GitOps | `gitops/applicationset.yaml` | ArgoCD ApplicationSet (all 3 envs) |
| Infrastructure | `terraform/` | Namespaces, RBAC, quotas via Terraform |
| Local stack | `docker-compose.yml` | API + Prometheus + Grafana |
| Release config | `.releaserc.json` | semantic-release automation |

## Environment Strategy

| Branch | Environment | Namespace | Replicas | TLS | HPA | NetworkPolicy |
|---|---|---|---|---|---|---|
| `dev` | Development | `securefin-dev` | 1 (fixed) | ❌ | ❌ | ❌ |
| `staging` | Pre-production | `securefin-staging` | 2–5 | ✅ | ✅ | ✅ |
| `main` | Production | `securefin-prod` | 2–10 | ✅ | ✅ | ✅ |

## Security Layers

1. **Source**: gitleaks (pre-commit + CI), CodeQL SAST
2. **Dependencies**: dependency-review-action on PRs
3. **Dockerfile**: hadolint lint
4. **Container image**: Trivy CVE scan, cosign signing, SBOM
5. **Runtime**: non-root (UID 1000), readOnlyRootFilesystem, no privilege escalation, capabilities dropped
6. **Kubernetes**: NetworkPolicy, dedicated ServiceAccount, Pod Security Standards

## Observability Stack

- `/metrics` endpoint → Prometheus ServiceMonitor → Prometheus → Grafana
- Structured JSON logs (pino) → stdout → (ship via log collector to Loki/ES)
- Grafana dashboard deployed as ConfigMap (auto-imported via label `grafana_dashboard: "1"`)

## Key Design Decisions

| Decision | Rationale | ADR |
|---|---|---|
| In-memory store | MVP simplicity; easy DB swap | ADR 001 |
| Helm over Kustomize | Parametric templating, release history | ADR 002 |
| Push build + Pull deploy | CI builds image; ArgoCD reconciles cluster | ADR 003 |
| Multi-arch Docker | ARM64 support (Graviton, Apple Silicon) | — |
| cosign keyless signing | No key management; OIDC-based | — |
| Terraform for namespaces | IaC for all cluster infrastructure | — |
