# variables.tf
variable "resource_group_name" {
  description = "Name of the resource group."
  type        = string
  default     = "E-Learning-Portal-RG-TF"
}

variable "location" {
  description = "The Azure region to deploy to."
  type        = string
  default     = "centralindia" 
}