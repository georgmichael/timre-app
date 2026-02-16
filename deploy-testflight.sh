#!/bin/bash

# Timre App - TestFlight Deployment Script
# This script helps you deploy your app to TestFlight

echo "🚀 Timre App - TestFlight Deployment"
echo "===================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null
then
    echo "❌ EAS CLI is not installed."
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI is installed"
echo ""

# Check if user is logged in
echo "Checking Expo login status..."
if ! eas whoami &> /dev/null
then
    echo "📝 Please login to your Expo account:"
    eas login
else
    echo "✅ Already logged in to Expo"
fi

echo ""
echo "Choose an option:"
echo "1) Build for iOS (TestFlight)"
echo "2) Submit to TestFlight"
echo "3) Build AND Submit"
echo "4) Check build status"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building for iOS..."
        eas build --platform ios --profile production
        ;;
    2)
        echo ""
        echo "📤 Submitting to TestFlight..."
        eas submit --platform ios --latest
        ;;
    3)
        echo ""
        echo "🔨 Building for iOS..."
        eas build --platform ios --profile production
        echo ""
        echo "⏳ Waiting for build to complete before submitting..."
        echo "📤 Now submitting to TestFlight..."
        eas submit --platform ios --latest
        ;;
    4)
        echo ""
        echo "📊 Recent builds:"
        eas build:list --platform ios --limit 5
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "📱 Next steps:"
echo "1. Go to https://appstoreconnect.apple.com"
echo "2. Navigate to TestFlight tab"
echo "3. Add yourself as a tester"
echo "4. Install TestFlight app on your iPhone"
echo "5. Accept the invitation and install Timre App!"
