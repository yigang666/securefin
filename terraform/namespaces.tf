# namespaces.tf — Kubernetes namespaces for each environment

resource "kubernetes_namespace" "securefin" {
  for_each = toset(var.environments)

  metadata {
    name = "securefin-${each.key}"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "environment"                  = each.key
      # Required for NetworkPolicy to allow ingress-nginx traffic
      "pod-security.kubernetes.io/enforce" = "restricted"
    }
  }
}

# GHCR image pull secret — injected into each namespace so K8s can pull images
resource "kubernetes_secret" "ghcr_pull_secret" {
  for_each = toset(var.environments)

  metadata {
    name      = "ghcr-pull-secret"
    namespace = kubernetes_namespace.securefin[each.key].metadata[0].name
  }

  type = "kubernetes.io/dockerconfigjson"
  data = {
    ".dockerconfigjson" = var.image_pull_secret_docker_config
  }
}
