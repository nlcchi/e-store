#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist/zip

# Function to package a Lambda function
package_lambda() {
  local function_name=$1
  echo "Packaging $function_name..."
  
  # Create temporary directory
  mkdir -p temp/$function_name
  
  # Copy function files
  cp -r lambda/$function_name/* temp/$function_name/
  
  # Install dependencies
  cd temp/$function_name
  npm install --production
  
  # Create zip file
  zip -r ../../dist/zip/$function_name.zip ./*
  
  # Clean up
  cd ../..
  rm -rf temp/$function_name
}

# Package each Lambda function
for func in lambda/*; do
  if [ -d "$func" ]; then
    function_name=$(basename "$func")
    package_lambda $function_name
  fi
done

# Clean up temp directory
rm -rf temp
