#!/usr/bin/env python3
"""
TDD Setup Verification Script

This script verifies that the TDD environment is correctly configured
and all necessary components are working.
"""
import sys
import os
import subprocess
from pathlib import Path

# Add src to Python path
project_root = Path(__file__).parent.parent
src_path = project_root / "src"
sys.path.insert(0, str(src_path))

def print_status(message, status="INFO"):
    """Print colored status messages"""
    colors = {
        "INFO": "\033[0;34m",    # Blue
        "SUCCESS": "\033[0;32m", # Green
        "WARNING": "\033[1;33m", # Yellow
        "ERROR": "\033[0;31m",   # Red
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}{message}{reset}")

def test_python_environment():
    """Test Python environment setup"""
    print_status("Testing Python environment...", "INFO")
    
    try:
        # Test Python version
        version = sys.version_info
        if version.major == 3 and version.minor >= 11:
            print_status(f"✅ Python {version.major}.{version.minor}.{version.micro}", "SUCCESS")
        else:
            print_status(f"⚠️  Python {version.major}.{version.minor}.{version.micro} (3.11+ recommended)", "WARNING")
        
        # Test virtual environment
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            print_status("✅ Virtual environment active", "SUCCESS")
        else:
            print_status("⚠️  No virtual environment detected", "WARNING")
        
        # Test key package imports
        try:
            import django
            print_status(f"✅ Django {django.get_version()}", "SUCCESS")
        except ImportError:
            print_status("❌ Django not installed", "ERROR")
            return False
        
        try:
            import pytest
            print_status(f"✅ pytest {pytest.__version__}", "SUCCESS")
        except ImportError:
            print_status("❌ pytest not installed", "ERROR")
            return False
        
        return True
        
    except Exception as e:
        print_status(f"❌ Python environment test failed: {e}", "ERROR")
        return False

def test_sentry_imports():
    """Test Sentry module imports"""
    print_status("Testing Sentry imports...", "INFO")
    
    try:
        # Test basic Sentry imports
        import sentry.utils.assets
        print_status("✅ sentry.utils.assets", "SUCCESS")
        
        import sentry.utils.auth
        print_status("✅ sentry.utils.auth", "SUCCESS")
        
        # Test fido2 fix
        from fido2.ctap2 import AuthenticatorData
        print_status("✅ fido2.ctap2.AuthenticatorData (compatibility fixed)", "SUCCESS")
        
        return True
        
    except ImportError as e:
        print_status(f"❌ Sentry import failed: {e}", "ERROR")
        print_status("💡 Ensure PYTHONPATH includes src/ directory", "INFO")
        return False
    except Exception as e:
        print_status(f"❌ Sentry import test failed: {e}", "ERROR")
        return False

def test_javascript_environment():
    """Test JavaScript/Node.js environment"""
    print_status("Testing JavaScript environment...", "INFO")
    
    try:
        # Test Node.js
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_status(f"✅ Node.js {result.stdout.strip()}", "SUCCESS")
        else:
            print_status("❌ Node.js not found", "ERROR")
            return False
        
        # Test pnpm
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_status(f"✅ pnpm {result.stdout.strip()}", "SUCCESS")
        else:
            print_status("❌ pnpm not found", "ERROR")
            return False
        
        # Check if node_modules exists
        if (project_root / "node_modules").exists():
            print_status("✅ Node.js dependencies installed", "SUCCESS")
        else:
            print_status("⚠️  Node.js dependencies not found", "WARNING")
            print_status("💡 Run: pnpm install", "INFO")
        
        return True
        
    except Exception as e:
        print_status(f"❌ JavaScript environment test failed: {e}", "ERROR")
        return False

def test_database_connections():
    """Test database service connections"""
    print_status("Testing database connections...", "INFO")
    
    # Test Redis
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        r.ping()
        print_status("✅ Redis connection", "SUCCESS")
    except Exception as e:
        print_status(f"❌ Redis connection failed: {e}", "ERROR")
        print_status("💡 Run: docker run --name sentry-redis-dev -p 6379:6379 -d redis:6-alpine", "INFO")
        return False
    
    # Test PostgreSQL
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            database="sentry",
            user="sentry",
            password="sentry"
        )
        conn.close()
        print_status("✅ PostgreSQL connection", "SUCCESS")
    except Exception as e:
        print_status(f"❌ PostgreSQL connection failed: {e}", "ERROR")
        print_status("💡 Run: docker run --name sentry-postgres-dev -e POSTGRES_DB=sentry -e POSTGRES_USER=sentry -e POSTGRES_PASSWORD=sentry -p 5432:5432 -d postgres:13", "INFO")
        return False
    
    return True

def test_code_quality_tools():
    """Test code quality tools"""
    print_status("Testing code quality tools...", "INFO")
    
    try:
        # Test pre-commit
        result = subprocess.run(['pre-commit', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_status(f"✅ pre-commit {result.stdout.strip()}", "SUCCESS")
        else:
            print_status("❌ pre-commit not found", "ERROR")
            return False
        
        # Test ESLint
        result = subprocess.run(['pnpm', 'run', 'lint:js', '--help'], capture_output=True, text=True)
        if result.returncode == 0:
            print_status("✅ ESLint configured", "SUCCESS")
        else:
            print_status("⚠️  ESLint configuration issue", "WARNING")
        
        return True
        
    except Exception as e:
        print_status(f"❌ Code quality tools test failed: {e}", "ERROR")
        return False

def test_quick_commands():
    """Test that key TDD commands work"""
    print_status("Testing TDD commands...", "INFO")
    
    try:
        # Test pytest can find tests
        result = subprocess.run(['python', '-m', 'pytest', '--collect-only', '-q'], 
                              capture_output=True, text=True, cwd=project_root)
        if result.returncode == 0:
            print_status("✅ pytest test discovery", "SUCCESS")
        else:
            print_status("⚠️  pytest test discovery issues", "WARNING")
        
        # Test Jest can find tests
        result = subprocess.run(['pnpm', 'test', '--listTests'], 
                              capture_output=True, text=True, cwd=project_root)
        if result.returncode == 0:
            print_status("✅ Jest test discovery", "SUCCESS")
        else:
            print_status("⚠️  Jest test discovery issues", "WARNING")
        
        return True
        
    except Exception as e:
        print_status(f"❌ TDD commands test failed: {e}", "ERROR")
        return False

def print_summary(all_passed):
    """Print setup summary and next steps"""
    print_status("\n" + "="*50, "INFO")
    
    if all_passed:
        print_status("🎉 TDD SETUP VERIFICATION PASSED!", "SUCCESS")
        print_status("\nYour environment is ready for test-driven development!", "SUCCESS")
        
        print_status("\n📋 Quick Start Commands:", "INFO")
        print_status("  Python TDD:", "INFO")
        print_status("    source .venv/bin/activate && source .env.tdd", "INFO")
        print_status("    pytest tests/sentry/utils/test_assets.py -v", "INFO")
        
        print_status("\n  JavaScript TDD:", "INFO")
        print_status("    pnpm test --watch", "INFO")
        
        print_status("\n  Code Quality:", "INFO")
        print_status("    pre-commit run --files src/sentry/path/to/file.py", "INFO")
        print_status("    pnpm run lint:js", "INFO")
        
        print_status("\n📚 Documentation:", "INFO")
        print_status("    docs/TDD_SETUP.md - Complete TDD guide", "INFO")
        print_status("    CLAUDE.md - Development patterns", "INFO")
        
    else:
        print_status("❌ TDD SETUP VERIFICATION FAILED", "ERROR")
        print_status("\nSome components need attention. See errors above.", "ERROR")
        print_status("\n💡 Common fixes:", "INFO")
        print_status("  1. Run: ./scripts/setup-tdd.sh", "INFO")
        print_status("  2. Ensure Docker services are running", "INFO")
        print_status("  3. Check that .venv is activated", "INFO")
        print_status("  4. Set PYTHONPATH: export PYTHONPATH=$PWD/src:$PYTHONPATH", "INFO")

def main():
    """Main verification function"""
    print_status("🔍 Sentry TDD Setup Verification", "INFO")
    print_status("="*40, "INFO")
    
    tests = [
        test_python_environment,
        test_sentry_imports,
        test_javascript_environment,
        test_database_connections,
        test_code_quality_tools,
        test_quick_commands,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
            print_status("")  # Add spacing between tests
        except Exception as e:
            print_status(f"❌ Test {test.__name__} crashed: {e}", "ERROR")
            results.append(False)
    
    all_passed = all(results)
    print_summary(all_passed)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())