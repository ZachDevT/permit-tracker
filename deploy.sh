#!/bin/bash

echo "🚀 Permit Tracker - Deployment Script"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with Firebase credentials"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Not logged in to Vercel"
    echo "Please run: vercel login"
    echo ""
    echo "Then run this script again, or deploy manually with:"
    echo "  vercel --prod"
    exit 1
fi

echo "✅ Authenticated with Vercel"
echo ""

# Deploy
echo "🚀 Deploying to production..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add environment variables in Vercel Dashboard"
    echo "2. Verify the deployment URL"
    echo "3. Test file upload functionality"
else
    echo "❌ Deployment failed!"
    exit 1
fi

