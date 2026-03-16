# SecureFin

A financial transaction recording service built with Node.js / Express, containerised with Docker, deployed on Kubernetes via Helm, and automated with GitHub Actions.

---

## Multi-Environment Deployment Strategy

SecureFin uses a **branch-per-environment** model. Each branch maps directly to a Kubernetes namespace and a Helm values file.

| Branch | Environment | Kubernetes Namespace | Helm Values File | Purpose |
|---|---|---|---|---|
| `dev` | Development | `securefin-dev` | `helm/values-dev.yaml` | Active development; deployed automatically on every push |
| `staging` | Pre-production | `securefin-staging` | `helm/values-staging.yaml` | Integration testing and sign-off; mirrors production config |
| `main` | Production | `securefin-prod` | `helm/values.yaml` | Live traffic; deployed on merge to main |

### Flow

```
feature/* ──► dev ──► staging ──► main
              │          │          │
           auto-deploy  auto-deploy manual-approval (GitHub env rule)
```

1. Developers push feature branches and merge to **`dev`** for integration.
2. When a release is ready, a PR is opened from `dev` to **`staging`**.
   The pipeline deploys to staging automatically; QA signs off.
3. A PR from `staging` to **`main`** triggers a production deployment after optional manual approval.

---

## Project Structure

```
SecureFin/
├── app/
│   ├── server.js          # Express API — POST /transactions, GET /transactions
│   ├── server.test.js     # Jest test suite
│   ├── package.json
│   └── Dockerfile         # Multi-stage Node.js 20 Alpine image
├── helm/
│   ├── Chart.yaml         # Chart metadata
│   ├── values.yaml        # Default (production) values
│   ├── values-dev.yaml    # Development overrides
│   ├── values-staging.yaml# Staging overrides
│   └── templates/
│       ├── deployment.yaml # Kubernetes Deployment
│       ├── service.yaml    # Kubernetes Service (ClusterIP)
│       └── ingress.yaml    # Kubernetes Ingress (nginx)
├── .github/
│   └── workflows/
│       └── ci-cd.yml      # GitHub Actions pipeline
└── README.md
```

---

## API Reference

### `POST /transactions`

Record a new transaction.

**Request body (JSON):**

```json
{
  "amount": 42.50,
  "currency": "USD",
  "description": "Coffee"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | yes | Positive numeric amount |
| `currency` | string | yes | ISO 4217 code (e.g. `USD`, `EUR`) |
| `description` | string | no | Human-readable note |

**Response `201 Created`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 42.50,
  "currency": "USD",
  "description": "Coffee",
  "timestamp": "2026-03-17T10:00:00.000Z"
}
```

---

### `GET /transactions`

Retrieve recorded transactions.

**Query params (all optional):**

| Param | Type | Description |
|---|---|---|
| `currency` | string | Filter by currency code (case-insensitive) |
| `limit` | number | Max results per page (default 100, max 500) |
| `offset` | number | Pagination offset (default 0) |

**Response `200 OK`:**

```json
{
  "total": 2,
  "limit": 100,
  "offset": 0,
  "data": [...]
}
```

---

## Local Development

```bash
cd app
npm install
npm run dev        # starts with nodemon (auto-reload)
npm test           # run Jest tests
```

---

## Docker Build

```bash
docker build -t securefin:local app/
docker run -p 3000:3000 securefin:local
```

---

## Helm Deployment

### Deploy to dev

```bash
helm upgrade --install securefin ./helm \
  --namespace securefin-dev --create-namespace \
  -f helm/values-dev.yaml \
  --set image.tag=<git-sha>
```

### Deploy to staging

```bash
helm upgrade --install securefin ./helm \
  --namespace securefin-staging --create-namespace \
  -f helm/values-staging.yaml \
  --set image.tag=<git-sha>
```

### Deploy to production

```bash
helm upgrade --install securefin ./helm \
  --namespace securefin-prod --create-namespace \
  -f helm/values.yaml \
  --set image.tag=<git-sha>
```

---

## GitHub Actions Secrets

Configure the following secrets in **Settings → Secrets → Actions**:

| Secret | Description |
|---|---|
| `KUBECONFIG_DEV` | base64-encoded kubeconfig for the dev cluster |
| `KUBECONFIG_STAGING` | base64-encoded kubeconfig for the staging cluster |
| `KUBECONFIG_PROD` | base64-encoded kubeconfig for the production cluster |
| `GHCR_TOKEN` | GitHub token with `packages:write` scope |

---

## .claude/ — AI Development State

This project uses a persistent Claude Code memory layout under `.claude/`:

| File | Purpose |
|---|---|
| `.claude/state/current.md` | Active task, last step, next action |
| `.claude/architecture/overview.md` | System design and design decisions |
| `.claude/checkpoints/` | Milestone snapshots |

Future Claude sessions should read these files at session start before continuing work.
