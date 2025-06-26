# Test-Driven Development Setup Guide

This guide helps you set up a complete TDD environment for Sentry development.

## Quick Start

For immediate setup, run our automated script:

```bash
./scripts/setup-tdd.sh
```

This script handles all dependencies, services, and configuration automatically.

## Manual Setup (if needed)

### Prerequisites

- Python 3.13+
- Node.js 22+ with pnpm
- Docker and Docker Compose
- Git

### 1. Python Environment

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements-dev.txt
pip install -r requirements-frozen.txt
pip install -e . --no-deps

# Fix fido2 compatibility
pip install fido2==0.9.2
```

### 2. JavaScript Environment

```bash
# Install Node dependencies
pnpm install
```

### 3. Database Services

```bash
# Start PostgreSQL and Redis
docker run --name sentry-postgres-dev \
  -e POSTGRES_DB=sentry \
  -e POSTGRES_USER=sentry \
  -e POSTGRES_PASSWORD=sentry \
  -p 5432:5432 -d postgres:13

docker run --name sentry-redis-dev \
  -p 6379:6379 -d redis:6-alpine
```

### 4. Verify Setup

```bash
# Run verification script
python scripts/verify-tdd-setup.py
```

## TDD Workflow

### Python Testing

```bash
# Activate environment
source .venv/bin/activate
export PYTHONPATH=$PWD/src:$PYTHONPATH

# Run specific tests
pytest tests/sentry/utils/test_assets.py -v

# Watch mode for TDD
pytest-watch tests/sentry/utils/
```

### JavaScript Testing

```bash
# Run all tests
pnpm test

# Watch mode for TDD
pnpm test --watch

# Run specific test
pnpm test static/app/components/avatar.spec.tsx
```

### Code Quality

```bash
# Python formatting and linting
source .venv/bin/activate
pre-commit run --files src/sentry/path/to/file.py

# JavaScript linting
pnpm run lint:js

# Fix all formatting issues
pnpm run fix
```

## Test-Driven Development Best Practices

### 1. Red-Green-Refactor Cycle

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Improve code while keeping tests green

### 2. Test Structure

#### Python Test Example

```python
# tests/sentry/utils/test_my_feature.py
from sentry.testutils.cases import TestCase
from sentry.utils.my_feature import my_function

class MyFeatureTest(TestCase):
    def test_my_function_returns_expected_value(self):
        # Arrange
        input_value = "test"
        
        # Act
        result = my_function(input_value)
        
        # Assert
        assert result == "expected_result"
```

#### JavaScript Test Example

```typescript
// static/app/components/myComponent.spec.tsx
import {render, screen} from '@testing-library/react';
import MyComponent from './myComponent';

describe('MyComponent', () => {
  it('renders with correct text', () => {
    // Arrange & Act
    render(<MyComponent title="Test Title" />);
    
    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### 3. Test Categories

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **API Tests**: Test endpoint behavior
- **End-to-End Tests**: Test complete user workflows

## Development Services

### Essential Services (Always Running)

- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage

### Optional Services (Add as needed)

- **ClickHouse**: For event analytics (via Snuba)
- **Kafka**: For event streaming
- **Symbolicator**: For symbol processing

### Service Management

```bash
# Start essential services
./scripts/start-dev-services.sh

# Stop services
./scripts/stop-dev-services.sh

# Reset services (clean slate)
./scripts/reset-dev-services.sh
```

## Troubleshooting

### Common Issues

1. **"No module named 'sentry'"**
   ```bash
   export PYTHONPATH=$PWD/src:$PYTHONPATH
   ```

2. **"fido2 import error"**
   ```bash
   pip install fido2==0.9.2
   ```

3. **"Database connection failed"**
   ```bash
   # Check if services are running
   docker ps | grep sentry
   
   # Restart services if needed
   ./scripts/start-dev-services.sh
   ```

4. **"Tests hanging or slow"**
   ```bash
   # Use --no-migrations for faster tests
   pytest --no-migrations tests/
   ```

### Performance Tips

- Use `--no-migrations` for unit tests
- Run tests in parallel with `pytest-xdist`
- Use `pnpm test --watch` for instant feedback
- Focus tests with `-k` pattern matching

## IDE Integration

### VS Code

Recommended extensions:
- Python extension
- TypeScript/JavaScript extension
- Jest extension
- ESLint extension

### Settings

```json
{
  "python.defaultInterpreterPath": ".venv/bin/python",
  "python.testing.pytestEnabled": true,
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

## Additional Resources

- [Sentry Development Guide](./CLAUDE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [API Documentation](../api-docs/)
- [Frontend Development](./FRONTEND.md)