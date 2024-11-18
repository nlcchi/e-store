resource "aws_dynamodb_table" "products" {
  name           = "products"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "price"
    type = "N"
  }

  global_secondary_index {
    name               = "category-index"
    hash_key          = "category"
    range_key         = "price"
    write_capacity    = 1
    read_capacity     = 1
    projection_type   = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "orders" {
  name           = "orders"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "user"
  range_key      = "intent"

  attribute {
    name = "user"
    type = "S"
  }

  attribute {
    name = "intent"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Auto Scaling for Products table
resource "aws_appautoscaling_target" "products_write_target" {
  max_capacity       = 2
  min_capacity       = 1
  resource_id        = "table/${aws_dynamodb_table.products.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "products_write_policy" {
  name               = "DynamoDBWriteCapacityUtilization:${aws_appautoscaling_target.products_write_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.products_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.products_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.products_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 75
  }
}

# Scheduled scaling
resource "aws_appautoscaling_scheduled_action" "products_scale_up" {
  name               = "scale-up"
  service_namespace  = aws_appautoscaling_target.products_write_target.service_namespace
  resource_id        = aws_appautoscaling_target.products_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.products_write_target.scalable_dimension
  schedule          = "cron(0 9 * * ? *)"

  scalable_target_action {
    min_capacity = 2
  }
}

resource "aws_appautoscaling_scheduled_action" "products_scale_down" {
  name               = "scale-down"
  service_namespace  = aws_appautoscaling_target.products_write_target.service_namespace
  resource_id        = aws_appautoscaling_target.products_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.products_write_target.scalable_dimension
  schedule          = "cron(0 14 * * ? *)"

  scalable_target_action {
    max_capacity = 2
  }
}
