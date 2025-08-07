#!/bin/bash

echo "🌟 Starting Crown Watch E-commerce Server..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the server."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo
fi

# Start the server
echo "🚀 Starting server on http://localhost:3000"
echo "📊 Admin dashboard: http://localhost:3000/admin.html"
echo "🛒 Shopping cart: http://localhost:3000/cart.html"
echo "📦 Orders page: http://localhost:3000/orders.html"
echo
echo "Press Ctrl+C to stop the server"
echo

node server.js