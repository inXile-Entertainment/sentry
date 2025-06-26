<p align="center">
  <p align="center">
    <a href="https://sentry.io/?utm_source=github&utm_medium=logo" target="_blank">
      <img src="https://sentry-brand.storage.googleapis.com/sentry-wordmark-dark-280x84.png" alt="Sentry" width="280" height="84" />
    </a>
  </p>
  <p align="center">
    Users and logs provide clues. Sentry provides answers.
  </p>
</p>

# What's Sentry?

Sentry is a developer-first error tracking and performance monitoring platform that helps developers see what actually matters, solve quicker, and learn continuously about their applications.

<p align="center">
  <img src="https://github.com/getsentry/sentry/raw/master/.github/screenshots/projects.png" width="270" />
  <img src="https://github.com/getsentry/sentry/raw/master/.github/screenshots/issue-details.png" width="270" />
  <img src="https://github.com/getsentry/sentry/raw/master/.github/screenshots/transaction-summary.png" width="270" />
  <img src="https://github.com/getsentry/sentry/raw/master/.github/screenshots/releases.png" width="270" />
</p>

# Development Quick Start

## TDD Environment Setup

Get started with test-driven development in one command:

```bash
./scripts/setup-tdd.sh
```

This automated script sets up:
- Python 3.13+ virtual environment with all dependencies
- Node.js environment with pnpm and 1700+ packages
- PostgreSQL and Redis databases via Docker
- Code quality tools (pre-commit, ESLint, pytest, Jest)
- Helper scripts for service management

**Manual setup:**
```bash
# Core dependencies
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt && pip install -r requirements-frozen.txt
pnpm install

# Database services
docker run --name sentry-postgres-dev -e POSTGRES_DB=sentry -e POSTGRES_USER=sentry -e POSTGRES_PASSWORD=sentry -p 5432:5432 -d postgres:13
docker run --name sentry-redis-dev -p 6379:6379 -d redis:6-alpine

# Verify setup
python scripts/verify-tdd-setup.py
```

## TDD Workflow

```bash
# Activate environment
source .venv/bin/activate && source .env.tdd

# Python test-driven development
pytest tests/sentry/utils/test_my_feature.py -v --watch

# JavaScript test-driven development  
pnpm test --watch

# Code quality checks
pre-commit run --files src/sentry/path/to/file.py
pnpm run lint:js
```

📚 **Complete guide:** [docs/TDD_SETUP.md](docs/TDD_SETUP.md)  
🛠️ **Development patterns:** [CLAUDE.md](CLAUDE.md)</p>

## Official Sentry SDKs

- [JavaScript](https://github.com/getsentry/sentry-javascript)
- [Electron](https://github.com/getsentry/sentry-electron/)
- [React-Native](https://github.com/getsentry/sentry-react-native)
- [Python](https://github.com/getsentry/sentry-python)
- [Ruby](https://github.com/getsentry/sentry-ruby)
- [PHP](https://github.com/getsentry/sentry-php)
- [Laravel](https://github.com/getsentry/sentry-laravel)
- [Go](https://github.com/getsentry/sentry-go)
- [Rust](https://github.com/getsentry/sentry-rust)
- [Java/Kotlin](https://github.com/getsentry/sentry-java)
- [Objective-C/Swift](https://github.com/getsentry/sentry-cocoa)
- [C\#/F\#](https://github.com/getsentry/sentry-dotnet)
- [C/C++](https://github.com/getsentry/sentry-native)
- [Dart](https://github.com/getsentry/sentry-dart)
- [Perl](https://github.com/getsentry/perl-raven)
- [Clojure](https://github.com/getsentry/sentry-clj/)
- [Elixir](https://github.com/getsentry/sentry-elixir)
- [Unity](https://github.com/getsentry/sentry-unity)
- [Unreal Engine](https://github.com/getsentry/sentry-unreal)
- [PowerShell](https://github.com/getsentry/sentry-powershell)

# Resources

- [Documentation](https://docs.sentry.io/)
- [Discussions](https://github.com/getsentry/sentry/discussions) (Bugs, feature requests,
  general questions)
- [Discord](https://discord.gg/PXa5Apfe7K)
- [Contributing](https://docs.sentry.io/internal/contributing/)
- [Bug Tracker](https://github.com/getsentry/sentry/issues)
- [Code](https://github.com/getsentry/sentry)
- [Transifex](https://www.transifex.com/getsentry/sentry/) (Translate
  Sentry\!)
