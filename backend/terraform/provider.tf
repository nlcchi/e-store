terraform {
  # Uncomment this block to use Terraform Cloud/Enterprise
  # backend "remote" {
  #   organization = "your-org-name"
  #   workspaces {
  #     name = "e-store-${var.environment}"
  #   }
  # }

  required_version = ">= 1.2.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region  # ap-southeast-1

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Region      = "ap-southeast-1"
    }
  }
}

# Provider alias for Hong Kong region (for backup/DR)
provider "aws" {
  alias  = "hongkong"
  region = "ap-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Region      = "ap-east-1"
    }
  }
}

# Provider alias for Mumbai region (for backup/DR)
provider "aws" {
  alias  = "mumbai"
  region = "ap-south-1"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Region      = "ap-south-1"
    }
  }
}
