terraform {
  # Uncomment this block to use Terraform Cloud/Enterprise
  # backend "remote" {
  #   organization = "your-org-name"
  #   workspaces {
  #     name = "e-store-${var.environment}"
  #   }
  # }

  required_version = ">= 1.2.0"
}

# Provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}
