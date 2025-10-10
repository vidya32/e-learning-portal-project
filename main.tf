# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# 2. Azure Container Registry (ACR)
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true # Required to easily integrate with the CI/CD pipeline
}

# 3. Azure Container Apps Environment
# A dedicated environment is required to host Container Apps
resource "azurerm_container_app_environment" "aca_env" {
  name                = var.environment_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  
  # A Log Analytics Workspace is a required dependency for the ACA environment
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

# Dependency: Log Analytics Workspace for Container Apps Environment
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.resource_group_name}-logs"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}
# 4. Azure Cosmos DB Account
resource "azurerm_cosmosdb_account" "db" {
  name                = "${var.resource_group_name}-db"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB" # Defines Core (SQL) API

  # Set up the consistency policy
  consistency_policy {
    consistency_level = "Session"
  }

  # Define the geographical redundancy
  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }
}

# 5. Azure Cosmos DB SQL Database
resource "azurerm_cosmosdb_sql_database" "db_sql" {
  name                = "eportal-db" # The actual database name your API uses
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.db.name
  throughput          = 400
}
# 6. Azure Storage Account
resource "azurerm_storage_account" "storage" {
  name                     = "storageeportal${substr(replace(azurerm_resource_group.rg.location, " ", ""), 0, 4)}" # Unique name requirement
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS" # Locally Redundant Storage
}

# 7. Azure Storage Container
resource "azurerm_storage_container" "files" {
  name                  = "eportal-files" # The container where files will be stored
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}
# 8. Azure Container App (The Application Host)
resource "azurerm_container_app" "eportal_app" {
  name                         = "eportal-app"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.aca_env.id

  # Authentication required to pull the image from ACR
  identity {
    type = "SystemAssigned"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  # Define the Container configuration
  template {
    container {
      name   = "eportal-container"
      image  = "${azurerm_container_registry.acr.login_server}/eportal:latest" # Image path from ACR
      cpu    = 0.5
      memory = "1.0Gi"

      # Pass connection strings and keys as Environment Variables
      env {
        name  = "COSMOSDB_CONNECTION_STRING"
        value = azurerm_cosmosdb_account.db.primary_connection_string
      }
      env {
        name  = "AZURE_STORAGE_CONNECTION_STRING"
        value = azurerm_storage_account.storage.primary_connection_string
      }
      env {
        name  = "AZURE_STORAGE_CONTAINER_NAME"
        value = azurerm_storage_container.files.name
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }

    # Define the Ingress (public endpoint)
    ingress {
      external_enabled = true # Makes the app publicly accessible
      target_port      = 80   # Port exposed by your Docker container (Nginx)
      allow_insecure   = false
      traffic_weight {
        latest_revision = true
        percentage      = 100
      }
    }
  }
}
# Outputs for easy access after deployment
output "container_app_url" {
  value       = azurerm_container_app.eportal_app.ingress[0].fqdn
  description = "The fully qualified domain name (URL) for the e-learning portal application."
}

output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "The login server address for the Azure Container Registry."
}