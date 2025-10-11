# main.tf

# 1. Create the Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# 2. Create the Azure Cosmos DB Account (Free Tier)
# Note: Enabling the Free Tier in Terraform can be complex, 
# but this structure sets up a basic account.
resource "azurerm_cosmosdb_account" "db" {
  name                = "elearningportaldb${random_string.suffix.result}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }
}

# 3. Create the Azure Static Web App (Free Tier)
resource "azurerm_static_web_app" "swa" {
  name                = "e-learning-portal-app-${random_string.suffix.result}"
  location            = "centralus"
  resource_group_name = azurerm_resource_group.rg.name
  sku_size            = "Free" # Explicitly use the Free SKU
}

# Helper to ensure unique global names
resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
  numeric = true
}