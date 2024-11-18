# Basic Lambda execution role
resource "aws_iam_role" "lambda_basic_execution" {
  name = "AWSLambdaBasicExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito Power User role
resource "aws_iam_role" "cognito_power_user" {
  name = "AmazonCognitoPowerUser"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# DynamoDB Full Access role
resource "aws_iam_role" "dynamodb_full_access" {
  name = "AmazonDynamoDBFullAccess"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# DynamoDB and SSM Full Access role
resource "aws_iam_role" "dynamodb_ssm_full_access" {
  name = "AmazonDynamoDBFullAccessWithSSMFullAccess"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/AmazonSSMFullAccess"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 Full Access role
resource "aws_iam_role" "s3_full_access" {
  name = "AmazonS3FullAccess"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/AmazonSSMFullAccess",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
