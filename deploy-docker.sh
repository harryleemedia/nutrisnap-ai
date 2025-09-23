#!/bin/bash

# NutriSnap AI Docker Deployment Script

echo "🚀 Deploying NutriSnap AI with Docker Compose..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️ docker-compose not found, trying docker compose...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
$DOCKER_COMPOSE down

# Build and start the application
echo -e "${YELLOW}🔨 Building and starting NutriSnap AI...${NC}"
$DOCKER_COMPOSE up --build -d

# Check if container is running
if docker ps | grep -q "nutrisnap-ai"; then
    echo -e "${GREEN}✅ NutriSnap AI deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Application is running at: http://localhost${NC}"
    echo -e "${GREEN}📊 Health check: http://localhost/health${NC}"
    echo ""
    echo -e "${YELLOW}📋 Useful commands:${NC}"
    echo "  View logs: $DOCKER_COMPOSE logs -f"
    echo "  Stop app:  $DOCKER_COMPOSE down"
    echo "  Restart:   $DOCKER_COMPOSE restart"
    echo "  Status:    $DOCKER_COMPOSE ps"
else
    echo -e "${RED}❌ Deployment failed. Check logs with: $DOCKER_COMPOSE logs${NC}"
    exit 1
fi