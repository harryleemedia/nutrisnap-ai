#!/bin/bash

# NutriSnap AI Deployment Script for Elestio

echo "🚀 Deploying NutriSnap AI to Elestio..."

# Set your Elestio server details here
SERVER_IP="your-elestio-server-ip"
SERVER_USER="root"
DEPLOY_PATH="/opt/app/nutrisnap-ai"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf nutrisnap-ai-deploy.tar.gz index.html styles.css script.js README.md

# Upload to server
echo "⬆️ Uploading to server..."
scp nutrisnap-ai-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Deploy on server
echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    # Create app directory
    mkdir -p /opt/app/nutrisnap-ai
    
    # Extract files
    cd /opt/app/nutrisnap-ai
    tar -xzf /tmp/nutrisnap-ai-deploy.tar.gz
    
    # Set permissions
    chmod -R 755 /opt/app/nutrisnap-ai
    
    # Clean up
    rm /tmp/nutrisnap-ai-deploy.tar.gz
    
    echo "✅ Deployment complete!"
    echo "📁 Files deployed to: /opt/app/nutrisnap-ai"
EOF

# Clean up local files
rm nutrisnap-ai-deploy.tar.gz

echo "🎉 NutriSnap AI deployed successfully!"
echo "🌐 Configure your web server to serve files from: $DEPLOY_PATH"