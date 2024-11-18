locals {
  product_pool_name = "${var.project_name}-product-pool"
  common_tags = {
    Project = var.project_name
    Environment = var.environment
  }
}

# Identity Pool for Product Management
resource "aws_cognito_identity_pool" "product_pool" {
  identity_pool_name               = local.product_pool_name
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = local.common_tags
}

# IAM Role for Product Management
resource "aws_iam_role" "product_management" {
  name = "product_management_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.product_pool.id
          }
        }
      }
    ]
  })

  inline_policy {
    name = "manage_product_policy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "dynamodb:PutItem",
            "dynamodb:DeleteItem"
          ]
          Resource = aws_dynamodb_table.products.arn
          Condition = {
            "ForAllValues:StringEquals" = {
              "dynamodb:LeadingKeys" = ["${data.aws_caller_identity.current.account_id}"]
            }
          }
        }
      ]
    })
  }

  tags = local.common_tags
}

# Identity Pool Role Attachment
resource "aws_cognito_identity_pool_roles_attachment" "product_pool_roles" {
  identity_pool_id = aws_cognito_identity_pool.product_pool.id

  roles = {
    authenticated   = aws_iam_role.product_management.arn
    unauthenticated = aws_iam_role.product_management.arn
  }

  role_mapping {
    identity_provider         = "${aws_cognito_user_pool.main.endpoint}:${aws_cognito_user_pool_client.main.id}"
    ambiguous_role_resolution = "Deny"
    type                     = "Token"
  }
}

# Admin Group
resource "aws_cognito_user_group" "admin" {
  user_pool_id  = aws_cognito_user_pool.main.id
  name          = "admin_group"
  description   = "For Admins"
  precedence    = 1
}

# Product Management Group
resource "aws_cognito_user_group" "product" {
  user_pool_id  = aws_cognito_user_pool.main.id
  name          = "manage_product_group"
  description   = "For Managing Products"
  precedence    = 2
  role_arn      = aws_iam_role.product_management.arn
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}
