# rbac.tf — RBAC for CI/CD service accounts
# Creates a Role that allows helm to manage resources in each namespace,
# bound to a ServiceAccount used by the CI/CD pipeline.

resource "kubernetes_service_account" "cicd" {
  for_each = toset(var.environments)

  metadata {
    name      = "cicd-deployer"
    namespace = kubernetes_namespace.securefin[each.key].metadata[0].name
  }
}

resource "kubernetes_role" "deployer" {
  for_each = toset(var.environments)

  metadata {
    name      = "securefin-deployer"
    namespace = kubernetes_namespace.securefin[each.key].metadata[0].name
  }

  rule {
    api_groups = ["apps", ""]
    resources  = ["deployments", "services", "configmaps", "serviceaccounts"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }
  rule {
    api_groups = ["networking.k8s.io"]
    resources  = ["ingresses", "networkpolicies"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }
  rule {
    api_groups = ["autoscaling", "policy"]
    resources  = ["horizontalpodautoscalers", "poddisruptionbudgets"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }
  rule {
    api_groups = ["monitoring.coreos.com"]
    resources  = ["servicemonitors"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }
}

resource "kubernetes_role_binding" "deployer" {
  for_each = toset(var.environments)

  metadata {
    name      = "securefin-deployer"
    namespace = kubernetes_namespace.securefin[each.key].metadata[0].name
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.deployer[each.key].metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.cicd[each.key].metadata[0].name
    namespace = kubernetes_namespace.securefin[each.key].metadata[0].name
  }
}
