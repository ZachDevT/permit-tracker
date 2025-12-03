#!/bin/bash

echo "🔥 Firebase Hosting Deployment"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Build the Next.js app
echo "📦 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Install function dependencies
if [ -d "functions" ]; then
    echo "📦 Installing Cloud Functions dependencies..."
    cd functions
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Function dependencies installation failed!"
        exit 1
    fi
    cd ..
    echo "✅ Function dependencies installed!"
    echo ""
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your app is live at:"
    firebase hosting:channel:list 2>/dev/null | grep "https://" | head -1 || echo "Check Firebase Console for URL"
    echo ""
    echo "📝 Next steps:"
    echo "1. Set Cloud Functions environment variables if needed"
    echo "2. Test the deployed application"
    echo "3. Monitor Cloud Functions logs"
else
    echo "❌ Deployment failed!"
    exit 1
fi

