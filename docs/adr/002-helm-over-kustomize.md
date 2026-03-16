# ADR 002 — Helm over Kustomize

**Date:** 2026-03-17
**Status:** Accepted

## Context

We need a way to manage Kubernetes manifests across three environments (dev, staging, prod) without duplicating YAML.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Helm** | Templating, packaging, release history, rollback, wide ecosystem | Go template syntax learning curve |
| **Kustomize** | Native kubectl support, patch-based (no templates) | Less powerful for parametric differences |
| **Raw YAML** | Simple | No DRY, maintenance nightmare at scale |

## Decision

Use **Helm 3** with a base `values.yaml` and per-environment overrides.

## Consequences

- Single chart definition, three values files
- `helm upgrade --install --atomic` provides automatic rollback on failed deploys
- Helm release history gives a full audit trail of what was deployed when
- ArgoCD has native Helm support, enabling clean GitOps integration
