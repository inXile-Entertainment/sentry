#!/bin/bash
set -e

# Sentry TDD Environment Setup Script
# This script sets up a complete test-driven development environment

echo "🚀 Setting up Sentry TDD Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not found"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not found"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not found"
        exit 1
    fi
    
    # Install pnpm if not present
    if ! command -v pnpm &> /dev/null; then
        print_status "Installing pnpm..."
        npm install -g pnpm
    fi
    
    print_success "Prerequisites check passed"
}

# Setup Python environment
setup_python() {
    print_status "Setting up Python environment..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install development dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements-dev.txt
    
    # Install base requirements with specific versions
    print_status "Installing base requirements..."
    pip install -r requirements-frozen.txt
    
    # Install Sentry package in development mode
    print_status "Installing Sentry package..."
    pip install -e . --no-deps
    
    # Fix fido2 compatibility issue
    print_status "Fixing fido2 compatibility..."
    pip install fido2==0.9.2
    
    print_success "Python environment setup complete"
}

# Setup JavaScript environment
setup_javascript() {
    print_status "Setting up JavaScript environment..."
    
    # Install Node dependencies
    print_status "Installing Node.js dependencies..."
    pnpm install
    
    print_success "JavaScript environment setup complete"
}

# Setup database services
setup_databases() {
    print_status "Setting up database services..."
    
    # Check if containers already exist and remove them
    if docker ps -a | grep -q "sentry-postgres-dev"; then
        print_status "Removing existing PostgreSQL container..."
        docker stop sentry-postgres-dev 2>/dev/null || true
        docker rm sentry-postgres-dev 2>/dev/null || true
    fi
    
    if docker ps -a | grep -q "sentry-redis-dev"; then
        print_status "Removing existing Redis container..."
        docker stop sentry-redis-dev 2>/dev/null || true
        docker rm sentry-redis-dev 2>/dev/null || true
    fi
    
    # Start PostgreSQL
    print_status "Starting PostgreSQL..."
    docker run --name sentry-postgres-dev \
        -e POSTGRES_DB=sentry \
        -e POSTGRES_USER=sentry \
        -e POSTGRES_PASSWORD=sentry \
        -p 5432:5432 -d postgres:13
    
    # Start Redis
    print_status "Starting Redis..."
    docker run --name sentry-redis-dev \
        -p 6379:6379 -d redis:6-alpine
    
    # Wait for services to be ready
    print_status "Waiting for databases to be ready..."
    sleep 10
    
    # Test connections
    if docker exec sentry-postgres-dev pg_isready -U sentry >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL might not be fully ready yet"
    fi
    
    if docker exec sentry-redis-dev redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_warning "Redis might not be fully ready yet"
    fi
}

# Create helper scripts
create_helper_scripts() {
    print_status "Creating helper scripts..."
    
    # Create start services script
    cat > scripts/start-dev-services.sh << 'EOF'
#!/bin/bash
echo "Starting development services..."

# Start PostgreSQL if not running
if ! docker ps | grep -q "sentry-postgres-dev"; then
    if docker ps -a | grep -q "sentry-postgres-dev"; then
        docker start sentry-postgres-dev
    else
        docker run --name sentry-postgres-dev \
            -e POSTGRES_DB=sentry \
            -e POSTGRES_USER=sentry \
            -e POSTGRES_PASSWORD=sentry \
            -p 5432:5432 -d postgres:13
    fi
fi

# Start Redis if not running
if ! docker ps | grep -q "sentry-redis-dev"; then
    if docker ps -a | grep -q "sentry-redis-dev"; then
        docker start sentry-redis-dev
    else
        docker run --name sentry-redis-dev \
            -p 6379:6379 -d redis:6-alpine
    fi
fi

echo "✅ Development services started"
EOF
    chmod +x scripts/start-dev-services.sh
    
    # Create stop services script
    cat > scripts/stop-dev-services.sh << 'EOF'
#!/bin/bash
echo "Stopping development services..."

docker stop sentry-postgres-dev sentry-redis-dev 2>/dev/null || true

echo "✅ Development services stopped"
EOF
    chmod +x scripts/stop-dev-services.sh
    
    # Create reset services script
    cat > scripts/reset-dev-services.sh << 'EOF'
#!/bin/bash
echo "Resetting development services..."

# Stop and remove containers
docker stop sentry-postgres-dev sentry-redis-dev 2>/dev/null || true
docker rm sentry-postgres-dev sentry-redis-dev 2>/dev/null || true

# Remove volumes
docker volume rm sentry_postgres_data 2>/dev/null || true

echo "✅ Development services reset"
echo "Run ./scripts/start-dev-services.sh to start fresh services"
EOF
    chmod +x scripts/reset-dev-services.sh
    
    print_success "Helper scripts created"
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    cat > .env.tdd << 'EOF'
# TDD Environment Configuration
export SENTRY_DB_NAME=sentry
export SENTRY_DB_USER=sentry
export SENTRY_DB_PASSWORD=sentry
export SENTRY_DB_HOST=localhost
export SENTRY_DB_PORT=5432

export SENTRY_REDIS_HOST=localhost
export SENTRY_REDIS_PORT=6379

# Python path for imports
export PYTHONPATH=$PWD/src:$PYTHONPATH

# Skip heavy services for TDD
export SENTRY_SKIP_BACKEND_VALIDATION=1
export SENTRY_SINGLE_ORGANIZATION=1
EOF
    
    print_success "Environment configuration created"
}

# Verify setup
verify_setup() {
    print_status "Verifying TDD setup..."
    
    # Run verification script
    source .venv/bin/activate
    source .env.tdd
    python scripts/verify-tdd-setup.py
}

# Main setup flow
main() {
    echo "🔧 Sentry Test-Driven Development Setup"
    echo "======================================="
    
    check_prerequisites
    setup_python
    setup_javascript
    setup_databases
    create_helper_scripts
    create_env_config
    verify_setup
    
    echo ""
    echo "🎉 TDD Setup Complete!"
    echo ""
    echo "Quick start commands:"
    echo "  source .venv/bin/activate && source .env.tdd"
    echo "  pytest tests/sentry/utils/test_assets.py -v"
    echo "  pnpm test --watch"
    echo ""
    echo "Helper scripts:"
    echo "  ./scripts/start-dev-services.sh  # Start databases"
    echo "  ./scripts/stop-dev-services.sh   # Stop databases"
    echo "  ./scripts/reset-dev-services.sh  # Reset databases"
    echo ""
    echo "Documentation: docs/TDD_SETUP.md"
}

# Run main function
main "$@"