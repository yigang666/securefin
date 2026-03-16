# quotas.tf — ResourceQuota and LimitRange per namespace
# ResourceQuota: caps total resource consumption in a namespace
# LimitRange: sets default requests/limits for containers that don't specify them

locals {
  quotas = {
    dev = {
      cpu    = "1"
      memory = "512Mi"
      pods   = "10"
    }
    staging = {
      cpu    = "4"
      memory = "2Gi"
      pods   = "20"
    }
    prod = {
      cpu    = "10"
      memory = "8Gi"
      pods   = "50"
    }
  }
}

resource "kubernetes_resource_quota" "securefin" {
  for_each = local.quotas

  metadata {
    name      = "securefin-quota"
    namespace = "securefin-${each.key}"
  }

  spec {
    hard = {
      "requests.cpu"    = each.value.cpu
      "requests.memory" = each.value.memory
      "pods"            = each.value.pods
    }
  }
}

resource "kubernetes_limit_range" "securefin" {
  for_each = toset(var.environments)

  metadata {
    name      = "securefin-limits"
    namespace = "securefin-${each.key}"
  }

  spec {
    limit {
      type = "Container"
      default = {
        cpu    = "200m"
        memory = "128Mi"
      }
      default_request = {
        cpu    = "50m"
        memory = "64Mi"
      }
    }
  }
}
