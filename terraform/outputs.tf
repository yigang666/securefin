output "namespace_names" {
  description = "Created Kubernetes namespace names"
  value       = { for k, v in kubernetes_namespace.securefin : k => v.metadata[0].name }
}

output "cicd_service_accounts" {
  description = "CI/CD ServiceAccount names per environment"
  value       = { for k, v in kubernetes_service_account.cicd : k => v.metadata[0].name }
}
