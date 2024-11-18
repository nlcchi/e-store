# Lambda function configuration
locals {
  lambda_functions = {
    register = {
      handler = "register"
      path    = "register"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "POST"
      route_path  = "/v1/register"
    }
    login = {
      handler = "login"
      path    = "login"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "POST"
      route_path  = "/v1/login"
    }
    logout = {
      handler = "logout"
      path    = "logout"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "POST"
      route_path  = "/v1/logout"
    }
    refresh = {
      handler = "refresh"
      path    = "refresh"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "POST"
      route_path  = "/v1/refresh"
    }
    verify = {
      handler = "verify"
      path    = "verify"
      role    = aws_iam_role.lambda_basic_execution.arn
      http_method = "POST"
      route_path  = "/v1/verify"
      authorizer  = true
    }
    user_group = {
      handler = "userGroup"
      path    = "userGroup"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = ["POST", "DELETE"]
      route_path  = "/v1/user-group/{groupname}"
      authorizer  = true
    }
    payment_hook = {
      handler = "paymentHook"
      path    = "payment/hook"
      role    = aws_iam_role.s3_full_access.arn
      http_method = "POST"
      route_path  = "/v1/payment/hook"
    }
    payment_checkout = {
      handler = "paymentCheckout"
      path    = "payment/checkout"
      role    = aws_iam_role.dynamodb_ssm_full_access.arn
      http_method = "POST"
      route_path  = "/v1/payment/checkout"
      authorizer  = true
    }
    product = {
      handler = "product"
      path    = "product"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = "POST"
      route_path  = "/v1/product"
      authorizer  = true
    }
    products = {
      handler = "products"
      path    = "products"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = "POST"
      route_path  = "/v1/products"
    }
    product_image = {
      handler = "productImage"
      path    = "product/id/image"
      role    = aws_iam_role.s3_full_access.arn
      http_method = ["POST", "DELETE"]
      route_path  = "/v1/product/{id}/image"
      authorizer  = true
    }
    order_create = {
      handler = "orderCreate"
      path    = "order/create"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = "POST"
      route_path  = "/v1/order/create"
      authorizer  = true
    }
    order = {
      handler = "order"
      path    = "order"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = "POST"
      route_path  = "/v1/order"
      authorizer  = true
    }
    order_intent = {
      handler = "orderIntent"
      path    = "order/intent"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = "POST"
      route_path  = "/v1/order/{intent}"
      authorizer  = true
    }
    country = {
      handler = "country"
      path    = "country"
      role    = aws_iam_role.lambda_basic_execution.arn
      http_method = "GET"
      route_path  = "/v1/country"
    }
    category = {
      handler = "category"
      path    = "category"
      role    = aws_iam_role.lambda_basic_execution.arn
      http_method = "GET"
      route_path  = "/v1/category"
    }
    auth = {
      handler = "auth"
      path    = "auth"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "GET"
      route_path  = "/v1/auth"
      authorizer  = true
    }
    users = {
      handler = "users"
      path    = "users"
      role    = aws_iam_role.cognito_power_user.arn
      http_method = "GET"
      route_path  = "/v1/users"
      authorizer  = true
    }
    product_id = {
      handler = "productId"
      path    = "product/id"
      role    = aws_iam_role.dynamodb_full_access.arn
      http_method = ["GET", "PUT", "DELETE"]
      route_path  = "/v1/product/{id}"
      authorizer  = true
    }
    s3_event = {
      handler = "s3Event"
      path    = "s3Event"
      role    = aws_iam_role.dynamodb_full_access.arn
    }
  }

  route_configs = flatten([
    for name, config in local.lambda_functions :
    [
      for method in (
        try(tolist(config.http_method), [lookup(config, "http_method", null)])
      ) :
      {
        key = "${name}_${method}"
        name = name
        method = method
        route_path = config.route_path
        authorizer = try(config.authorizer, false)
      }
      if contains(keys(config), "route_path") && contains(keys(config), "http_method")
    ]
  ])
}

# Lambda Authorizer
resource "aws_lambda_function" "authorizer" {
  filename         = "./../dist/zip/authorizer.zip"
  function_name    = "authorizer"
  role            = aws_iam_role.cognito_power_user.arn
  handler         = "index.handler"
  runtime         = "nodejs16.x"

  environment {
    variables = var.lambda_environment_variables
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create Lambda functions
resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  filename         = "./../dist/zip/${each.value.handler}.zip"
  function_name    = each.value.handler
  role            = each.value.role
  handler         = "index.handler"
  runtime         = "nodejs16.x"

  environment {
    variables = var.lambda_environment_variables
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda Authorizer Permission
resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Lambda Function Permissions
resource "aws_lambda_permission" "functions" {
  for_each = aws_lambda_function.functions

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# API Gateway Authorizer
resource "aws_apigatewayv2_authorizer" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.authorizer.invoke_arn
  identity_sources = ["$request.header.Authorization"]
  name            = "lambdaAuthorizer"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses = true
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "routes" {
  for_each = {
    for route in local.route_configs : route.key => route
  }

  api_id    = aws_apigatewayv2_api.main.id
  route_key = "${each.value.method} ${each.value.route_path}"
  target    = "integrations/${aws_apigatewayv2_integration.integrations[each.value.name].id}"

  authorization_type = each.value.authorizer ? "CUSTOM" : "NONE"
  authorizer_id      = each.value.authorizer ? aws_apigatewayv2_authorizer.lambda.id : null
}

# API Gateway Integrations
resource "aws_apigatewayv2_integration" "integrations" {
  for_each = {
    for name, config in local.lambda_functions :
    name => config if contains(keys(config), "route_path")
  }

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.functions[each.key].invoke_arn
  payload_format_version = "2.0"
}

# Lambda permission for S3 bucket
resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions["s3_event"].function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.product_images.arn
}

# S3 bucket notification configuration
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.product_images.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.functions["s3_event"].arn
    events              = ["s3:ObjectCreated:*"]
  }
  depends_on = [aws_lambda_permission.allow_bucket]
}
