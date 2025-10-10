variable "resource_group_name" {
  description = "The name of the resource group."
  type        = string
  default     = "rg-eportal-dev-001"
}

variable "location" {
  description = "The Azure region to deploy resources in."
  type        = string
  default     = "East US"
}

variable "acr_name" {
  description = "The name for the Azure Container Registry."
  type        = string
  default     = "acreportaldev001"
}

variable "environment_name" {
  description = "The name for the Azure Container Apps Environment."
  type        = string
  default     = "aca-eportal-env"
}