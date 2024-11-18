# E-Store Terraform Infrastructure

This directory contains Terraform configurations for the E-Store backend infrastructure.

## Prerequisites

- Terraform >= 1.2.0
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Structure

- `main.tf` - Main infrastructure configuration
- `variables.tf` - Variable definitions
- `outputs.tf` (to be added) - Output definitions
- `terraform.tfvars` (to be created) - Variable values

## Getting Started

1. Initialize Terraform:
```bash
terraform init
```

2. Review the planned changes:
```bash
terraform plan
```

3. Apply the changes:
```bash
terraform apply
```

## Infrastructure Components

Currently configured:
- CloudWatch Dashboard with:
  - API Gateway metrics
  - Lambda function metrics
  - DynamoDB metrics
  - Order processing logs
  - Error monitoring logs

## Deployed Infrastructure Components

The following AWS resources were successfully deployed and managed:

- **API Gateway**: HTTP API for handling all backend requests
- **Lambda Functions**: Serverless compute for various microservices
  - User management
  - Product management
  - Order processing
  - Payment processing
- **DynamoDB Tables**: NoSQL database for storing:
  - User data
  - Products
  - Orders
  - Shopping carts
- **Cognito**: User authentication and authorization
- **S3 Buckets**: Storage for product images and assets
- **IAM Roles**: Necessary permissions for all components
- **CloudWatch**: Monitoring and logging

Note: This infrastructure has been decommissioned using `terraform destroy` but the configuration is preserved for documentation and future reference.

## Variables

| Name | Description | Default |
|------|-------------|---------|
| aws_region | AWS region for all resources | us-east-1 |
| environment | Environment (dev, prod) | dev |
| project_name | Project name prefix | e-store |

## Notes

- The CloudWatch dashboard is configured with various widgets to monitor different aspects of the e-store application
- Log groups are configured to monitor Lambda functions, API Gateway, and other services
- Metrics are collected at 1-minute intervals for real-time monitoring
