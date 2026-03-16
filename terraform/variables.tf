variable "kubeconfig_path" {
  description = "Path to the kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubernetes context to use"
  type        = string
}

variable "environments" {
  description = "List of environments to provision"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "image_pull_secret_docker_config" {
  description = "base64-encoded Docker config JSON for GHCR pull secret"
  type        = string
  sensitive   = true
}
