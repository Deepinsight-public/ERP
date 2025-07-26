#!/bin/bash

echo "🔥 Firebase Setup Test Script"
echo "=============================="

echo "📁 Checking environment files..."
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
else
    echo "❌ backend/.env missing"
    exit 1
fi

if [ -f "frontend/.env.local" ]; then
    echo "✅ frontend/.env.local exists"
else
    echo "❌ frontend/.env.local missing"
    exit 1
fi

echo ""
echo "🔧 Checking backend Firebase variables..."
source backend/.env

required_backend_vars=(
    "FIREBASE_PROJECT_ID"
    "FIREBASE_PRIVATE_KEY"
    "FIREBASE_CLIENT_EMAIL"
)

for var in "${required_backend_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
    else
        if [[ "${!var}" == *"your-"* ]] || [[ "${!var}" == *"demo-"* ]]; then
            echo "⚠️  $var contains placeholder value"
        else
            echo "✅ $var is set"
        fi
    fi
done

echo ""
echo "🌐 Checking frontend Firebase variables..."
if [ -f "frontend/.env.local" ]; then
    source frontend/.env.local
    
    required_frontend_vars=(
        "NEXT_PUBLIC_FIREBASE_API_KEY"
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    )
    
    for var in "${required_frontend_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ $var is not set"
        else
            if [[ "${!var}" == *"your-"* ]] || [[ "${!var}" == *"demo-"* ]]; then
                echo "⚠️  $var contains placeholder value"
            else
                echo "✅ $var is set"
            fi
        fi
    done
fi

echo ""
echo "🚀 To test the setup:"
echo "1. Update environment variables with real Firebase credentials"
echo "2. Run 'npm run dev' in both backend/ and frontend/ directories"
echo "3. Visit http://localhost:3000 and test authentication"
echo "4. Check console logs for Firebase initialization messages"
