resource "aws_s3_bucket" "product_images" {
  # Using a timestamp in the bucket name as in CDK, but you might want to use a more stable naming convention
  bucket = "bucket-product-images-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  # Force destroy is enabled as per CDK's autoDeleteObjects: true
  force_destroy = true
}

# Enable versioning (though set to false, we need this block to explicitly disable versioning)
resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id
  versioning_configuration {
    status = "Disabled"
  }
}

# Configure public access block (equivalent to CDK's blockPublicAccess: BlockPublicAccess.BLOCK_ACLS)
resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configure CORS
resource "aws_s3_bucket_cors_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_origins = var.allowed_origins
    max_age_seconds = 3000
  }
}

# Configure lifecycle rules
resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 90
    }
  }
}

# Allow public read access through bucket policy
resource "aws_s3_bucket_policy" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.product_images.arn}/*"
      },
    ]
  })

  # This dependency ensures the public access block is configured first
  depends_on = [aws_s3_bucket_public_access_block.product_images]
}
