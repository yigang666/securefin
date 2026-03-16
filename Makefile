# Makefile — SecureFin developer shortcuts
# Run `make help` to see all available targets.

.DEFAULT_GOAL := help
.PHONY: help dev test lint build deploy-dev deploy-staging k8s-status tf-init tf-plan tf-apply clean

# ── Help ──────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Local development ─────────────────────────────────────────────────────────
dev: ## Start API with hot-reload (nodemon)
	cd app && npm run dev

test: ## Run Jest test suite
	cd app && npm test

lint: ## Lint Dockerfile and Helm chart
	hadolint app/Dockerfile
	helm lint ./helm -f helm/values.yaml
	helm lint ./helm -f helm/values-dev.yaml
	helm lint ./helm -f helm/values-staging.yaml

# ── Docker ────────────────────────────────────────────────────────────────────
build: ## Build Docker image locally
	docker build -t securefin:local app/

run: build ## Build and run container locally
	docker run --rm -p 3000:3000 --env-file app/.env.example securefin:local

compose-up: ## Start full local stack with docker-compose
	docker compose up --build

compose-down: ## Stop local stack
	docker compose down

# ── Helm deploy ───────────────────────────────────────────────────────────────
deploy-dev: ## Deploy to dev namespace (requires kubectl context)
	helm upgrade --install securefin ./helm \
	  --namespace securefin-dev --create-namespace \
	  -f helm/values-dev.yaml

deploy-staging: ## Deploy to staging namespace
	helm upgrade --install securefin ./helm \
	  --namespace securefin-staging --create-namespace \
	  -f helm/values-staging.yaml

deploy-prod: ## Deploy to production namespace (use with care)
	@echo "⚠️  Deploying to PRODUCTION. Press Ctrl+C within 5s to abort..."
	@sleep 5
	helm upgrade --install securefin ./helm \
	  --namespace securefin-prod --create-namespace \
	  -f helm/values.yaml

# ── Kubernetes status ─────────────────────────────────────────────────────────
k8s-status: ## Show pod status across all namespaces
	@for ns in securefin-dev securefin-staging securefin-prod; do \
	  echo "\n=== $$ns ==="; \
	  kubectl get pods -n $$ns 2>/dev/null || echo "  (namespace not found)"; \
	done

# ── Terraform ─────────────────────────────────────────────────────────────────
tf-init: ## Initialise Terraform (download providers)
	cd terraform && terraform init

tf-plan: ## Preview Terraform changes
	cd terraform && terraform plan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply

# ── Cleanup ────────────────────────────────────────────────────────────────────
clean: ## Remove local build artefacts
	rm -rf app/node_modules
	docker rmi securefin:local 2>/dev/null || true
