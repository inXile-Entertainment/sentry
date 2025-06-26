# Development Scripts

This directory contains helper scripts for Sentry development.

## TDD Setup Scripts

### `setup-tdd.sh`
Automated setup script for test-driven development environment.

```bash
./scripts/setup-tdd.sh
```

This script:
- Checks prerequisites (Python, Node.js, Docker)
- Sets up Python virtual environment
- Installs all dependencies
- Starts database services
- Creates helper scripts
- Verifies the setup

### `verify-tdd-setup.py`
Verification script to check TDD environment health.

```bash
python scripts/verify-tdd-setup.py
```

This script tests:
- Python environment and imports
- JavaScript environment
- Database connections
- Code quality tools
- Test discovery

## Service Management Scripts

### `start-dev-services.sh`
Starts development database services.

```bash
./scripts/start-dev-services.sh
```

### `stop-dev-services.sh`
Stops development database services.

```bash
./scripts/stop-dev-services.sh
```

### `reset-dev-services.sh`
Completely resets development services (removes containers and data).

```bash
./scripts/reset-dev-services.sh
```

## Usage Examples

### First-time setup
```bash
# Clone repository
git clone <sentry-repo>
cd sentry

# Run automated setup
./scripts/setup-tdd.sh

# Verify setup worked
python scripts/verify-tdd-setup.py
```

### Daily development
```bash
# Start services
./scripts/start-dev-services.sh

# Activate environment
source .venv/bin/activate
source .env.tdd

# Start TDD cycle
pytest tests/sentry/utils/test_my_feature.py --watch
```

### Troubleshooting
```bash
# Check environment health
python scripts/verify-tdd-setup.py

# Reset services if issues
./scripts/reset-dev-services.sh
./scripts/start-dev-services.sh
```