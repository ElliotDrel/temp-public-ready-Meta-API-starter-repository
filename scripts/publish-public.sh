#!/usr/bin/env bash
# Run interactively on YOUR machine with a GitHub-authenticated gh CLI.
# Never use `git clone --mirror` or transfer buildpurdue's original .git history.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
NAME="${1:-meta-auto-posting-starter}"
if ! command -v gh >/dev/null 2>&1; then
  echo 'GitHub CLI is required: https://cli.github.com/' >&2
  exit 1
fi
gh auth status >/dev/null
if [[ -d .git ]]; then
  echo 'Refusing to publish a directory with existing .git history; inspect it first.' >&2
  exit 1
fi
if [[ "$NAME" == *'/'* ]]; then
  echo 'Use a simple repository name (no owner); gh uses the signed-in account.' >&2
  exit 1
fi
printf 'This publishes %s publicly under your current GitHub account.\n' "$NAME"
printf 'Review docs/security-publication-checklist.md and confirm rights first.\n'
read -r -p 'Type PUBLISH to continue: ' CONFIRM
if [[ "$CONFIRM" != 'PUBLISH' ]]; then echo 'Cancelled'; exit 1; fi
npm run check
npm test
git init -b main
git add .
git commit -m 'docs: publish sanitized Meta API starter'
gh repo create "$NAME" --public --source=. --remote=origin --push
gh repo view --web
