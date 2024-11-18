#!/bin/bash

# Create a temporary directory for zip files
mkdir -p dist/zip

# Loop through each function directory in dist/src
for dir in dist/src/*/; do
    # Get the function name from directory path
    func_name=$(basename "$dir")
    
    # Create zip file
    cd "dist/src/$func_name"
    zip -r "../../zip/$func_name.zip" ./*
    cd ../../..
done

echo "All Lambda functions have been packaged successfully!"
