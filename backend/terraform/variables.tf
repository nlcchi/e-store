variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name to be used as a prefix"
  type        = string
  default     = "e-store"
}

variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:3000", "https://your-domain.com"]
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point in time recovery for DynamoDB tables"
  type        = bool
  default     = true
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PROVISIONED"
}

variable "dynamodb_min_capacity" {
  description = "DynamoDB minimum capacity units"
  type        = number
  default     = 1
}

variable "dynamodb_max_capacity" {
  description = "DynamoDB maximum capacity units"
  type        = number
  default     = 2
}

variable "lambda_environment_variables" {
  description = "Environment variables for Lambda functions"
  type        = map(string)
  default     = {
    NODE_ENV     = "production"
    API_VERSION  = "v1"
    REGION       = "us-east-1"
    PROJECT_NAME = "e-store"
  }
}
