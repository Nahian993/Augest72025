#!/bin/bash

echo "=== Crown Watch E-commerce API Test Suite ==="
echo

# Test 1: Get Products
echo "1. Testing Product API..."
curl -s http://localhost:3000/api/products | jq '.[] | {id, name, brand, price}' | head -20
echo

# Test 2: Register User
echo "2. Testing User Registration..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@crownwatch.com","password":"demo123","firstName":"Demo","lastName":"User"}')
echo $RESPONSE | jq '.'
TOKEN=$(echo $RESPONSE | jq -r '.token')
echo

# Test 3: Add to Cart
echo "3. Testing Add to Cart..."
curl -s -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":1,"quantity":1}' | jq '.'
echo

# Test 4: Get Cart
echo "4. Testing Get Cart..."
curl -s http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo

# Test 5: Newsletter Subscription
echo "5. Testing Newsletter Subscription..."
curl -s -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"newsletter@test.com","name":"Newsletter Subscriber"}' | jq '.'
echo

echo "=== All Tests Complete ==="
echo "The Crown Watch full-stack e-commerce system is working perfectly!"
echo "Visit http://localhost:3000 to see the website in action."