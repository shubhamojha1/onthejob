#!/usr/bin/env bash
# Cron wrapper for the statuspage ingestion worker.
# Runs on the headless Ubuntu server. Install (see docs/server-setup.md):
#
#   crontab -e
#   30 8 * * *  /home/<user>/onthejob/scripts/worker-cron.sh
#
# Cron gives an almost-empty environment — everything is set explicitly here.

set -u  # unset vars are bugs; NOT -e — we want to log failures, not die silently

# ── Environment (cron-safe) ───────────────────────────────────────────────────
export HOME="${HOME:-/home/$(whoami)}"
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$HOME/onthejob-worker.log"

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*" >> "$LOG_FILE"; }

fail() {
  log "FATAL: $*"
  exit 1
}

log "── run start ──"
cd "$REPO_DIR" || fail "cannot cd to $REPO_DIR"

# ── Preflight ─────────────────────────────────────────────────────────────────
command -v node   >/dev/null || fail "node not in PATH"
command -v gh     >/dev/null || fail "gh not in PATH"
command -v claude >/dev/null || fail "claude not in PATH"

# Auth checks up front — a dead OAuth token should log loudly, not crash-loop
gh auth status >/dev/null 2>&1 || fail "gh not authenticated — run: gh auth login"

# ── Sync (deployment = git pull) ──────────────────────────────────────────────
git checkout -q main               >> "$LOG_FILE" 2>&1 || fail "git checkout main failed (dirty tree?)"
git pull --ff-only -q origin main  >> "$LOG_FILE" 2>&1 || fail "git pull failed"

# Reinstall deps only when the lockfile changed since last run
LOCK_HASH_FILE="$HOME/.onthejob-lock-hash"
LOCK_HASH="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ ! -f "$LOCK_HASH_FILE" ] || [ "$(cat "$LOCK_HASH_FILE")" != "$LOCK_HASH" ]; then
  log "package-lock.json changed — npm ci"
  npm ci --silent >> "$LOG_FILE" 2>&1 || fail "npm ci failed"
  echo "$LOCK_HASH" > "$LOCK_HASH_FILE"
fi

# ── Run worker ────────────────────────────────────────────────────────────────
npm run --silent statuspage-worker >> "$LOG_FILE" 2>&1
STATUS=$?

if [ $STATUS -eq 0 ]; then
  log "── run ok ──"
elif [ $STATUS -eq 2 ]; then
  log "── run SKIPPED: backend unavailable (claude login expired?) — re-auth needed ──"
else
  log "── run FAILED (exit $STATUS) — see output above ──"
fi

exit $STATUS
