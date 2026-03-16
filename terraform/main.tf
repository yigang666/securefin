# main.tf — Terraform provider configuration
# Manages the Kubernetes infrastructure that SecureFin runs on.
#
# What this provisions:
#   - Three Kubernetes namespaces (dev, staging, prod)
#   - RBAC roles and bindings per namespace
#   - ResourceQuota + LimitRange per namespace
#   - cert-manager and nginx Ingress Controller via Helm

terraform {
  required_version = ">= 1.6"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
  }

  # Remote state — replace with your backend
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "securefin/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kube_context
}

provider "helm" {
  kubernetes {
    config_path    = var.kubeconfig_path
    config_context = var.kube_context
  }
}
