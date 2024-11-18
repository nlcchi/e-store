terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "e_store_dashboard" {
  dashboard_name = "E-Store-Dashboard"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "Count", { "stat": "Sum", "period": 60 }],
            ["AWS/ApiGateway", "4XXError", { "stat": "Sum", "period": 60 }],
            ["AWS/ApiGateway", "5XXError", { "stat": "Sum", "period": 60 }]
          ]
          region = "us-east-1"
          title  = "API Gateway"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Invocations", { "stat": "Sum", "period": 60 }],
            ["AWS/Lambda", "Errors", { "stat": "Sum", "period": 60 }],
            ["AWS/Lambda", "Duration", { "stat": "Average", "period": 60 }]
          ]
          region = "us-east-1"
          title  = "Lambda Functions"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { "stat": "Sum", "period": 60 }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", { "stat": "Sum", "period": 60 }],
            ["AWS/DynamoDB", "ThrottledRequests", { "stat": "Sum", "period": 60 }]
          ]
          region = "us-east-1"
          title  = "DynamoDB"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          query   = "SOURCE '/aws/lambda/orderCreate' | SOURCE '/aws/lambda/paymentCheckout' | SOURCE '/aws/apigateway/e-store-api' | SOURCE '/aws/lambda/productService' | stats count(*) as orderCount group by status | sort orderCount desc"
          region  = "us-east-1"
          title   = "Order Processing"
          view    = "table"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 18
        width  = 24
        height = 6
        properties = {
          query   = "SOURCE '/aws/lambda/orderCreate' | SOURCE '/aws/lambda/paymentCheckout' | SOURCE '/aws/apigateway/e-store-api' | SOURCE '/aws/lambda/productService' | filter @message like /(?i)(error|exception)/ | stats count(*) as errorCount by @logStream | sort errorCount desc"
          region  = "us-east-1"
          title   = "Error Monitoring"
          view    = "table"
        }
      }
    ]
  })
}
