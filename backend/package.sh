#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist/zip

# Array of function names
functions=(
    "auth"
    "authorizer"
    "category"
    "country"
    "login"
    "logout"
    "order"
    "order_create"
    "order_intent"
    "payment_checkout"
    "payment_hook"
    "product"
    "product_id"
    "product_image"
    "products"
    "refresh"
    "register"
    "s3_event"
    "user_group"
    "users"
    "verify"
)

# Package each function
for func in "${functions[@]}"
do
    echo "Packaging $func..."
    cp src/functions/index.js src/functions/$func.js
    cd src/functions && zip ../../dist/zip/$func.zip $func.js
    rm src/functions/$func.js
done

echo "All functions packaged successfully!"
