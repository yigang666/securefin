# ADR 003 — Push-based CI/CD with ArgoCD GitOps Layer

**Date:** 2026-03-17
**Status:** Accepted

## Context

There are two dominant deployment models:
- **Push-based**: CI runner has cluster credentials and runs `helm upgrade` directly
- **Pull-based (GitOps)**: A cluster-side agent (ArgoCD) watches Git and reconciles state

## Decision

Implement **both**:
1. GitHub Actions handles build and test (push-based for the image pipeline)
2. ArgoCD handles deployment (pull-based for the Kubernetes reconcile loop)

## Rationale

| Concern | Push | Pull (GitOps) |
|---|---|---|
| Cluster credential exposure | CI runner needs kubeconfig | Cluster only needs Git read access |
| Drift detection | None — CI only runs on push | ArgoCD continuously reconciles |
| Audit trail | GitHub Actions logs | ArgoCD UI + Git history |
| Rollback | Re-run CI for old SHA | `argocd app rollback` |

## Consequences

- CI pipeline builds and pushes the image, then updates the `image.tag` value
- ArgoCD detects the Git change and syncs the cluster
- Production deployments require a manual ArgoCD sync (approval gate)
- Cluster kubeconfigs are NOT needed in GitHub Secrets when using ArgoCD (only the ArgoCD image updater needs registry access)
