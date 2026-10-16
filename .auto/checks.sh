#!/usr/bin/env bash
set -euo pipefail

# Run glossary, linter, formatting, test suite, and typecheck
pnpm glossary
pnpm lint
pnpm format:check
pnpm test --isolate=false
pnpm build
