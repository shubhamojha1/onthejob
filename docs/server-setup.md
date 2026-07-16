# Headless server setup — statuspage ingestion worker

One-time setup for running `scripts/statuspage-worker.ts` on a cron from a headless
Ubuntu machine (the repurposed laptop). The worker polls Statuspage incident APIs,
extracts via headless Claude Code (`claude -p`, subscription auth — no
`ANTHROPIC_API_KEY`), and opens draft PRs via `gh`. Each PR includes a suggested
tweet (drafted by the same extraction call) for announcing the incident — copy it out
and post manually; the worker does not post to Twitter/X itself.

Deployment model: **git pull at run start**. Push changes to `main` from the dev
machine; the server picks them up on its next run. Incident PRs flow back through
GitHub for review/merge.

## 1. Base packages

```bash
sudo apt update && sudo apt install -y git curl

# Node 20+ (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# GitHub CLI
sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install -y gh

# Claude Code
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. Auth (interactive, once, over SSH)

```bash
gh auth login          # HTTPS, browser-less: choose "Paste an authentication token"
                       #   or device-code flow; scope: repo
claude                 # launches interactive session → /login → follow the
                       #   OAuth URL from another machine's browser, paste code
```

Verify:

```bash
gh auth status
echo "say ok" | claude -p --output-format text   # should print a response
```

Notes:
- `claude` stores OAuth creds under `~/.claude/`. If the token eventually expires,
  the worker exits with code 2 and the cron log says re-auth needed — rerun `claude` → `/login`.
- `gh auth login` with a fine-grained PAT (repo scope on this repo) works if the
  device flow is awkward.

## 3. Repo

```bash
git clone https://github.com/shubhamojha1/onthejob.git ~/onthejob
cd ~/onthejob && npm ci
chmod +x scripts/worker-cron.sh

# Smoke test (no LLM, no PRs):
npm run statuspage-worker -- --dry-run
```

git identity for the PR commits the worker makes:

```bash
git config user.name  "systemsfailed-worker"
git config user.email "subham.k.ojha@gmail.com"
```

## 4. Power (no 24/7 requirement)

No always-on setup needed. Cron only fires while the machine is powered on and awake;
if it's asleep or off at 08:30 UTC, that run is simply skipped. Dedup is stateless
(derived from the repo, not run history — see "Operations" below), so a missed day is
harmless and gets picked up the next time cron fires on an awake machine. Leave lid-close
and suspend behavior at their defaults.

## 5. Cron

```bash
crontab -e
```

```cron
# statuspage ingestion worker — daily 08:30 UTC
# (offset from the GitHub-Actions discovery bot at 07:00 UTC)
30 8 * * * /home/YOUR_USER/onthejob/scripts/worker-cron.sh
```

Log: `~/systemsfailed-worker.log`. Rotate it:

```bash
sudo tee /etc/logrotate.d/systemsfailed-worker > /dev/null <<'EOF'
/home/YOUR_USER/systemsfailed-worker.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
}
EOF
```

## 6. Unattended security updates + periodic reboot

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Optional monthly reboot for kernel updates (root crontab):

```cron
0 5 1 * * /sbin/shutdown -r now
```

## Operations

| Action | How |
|---|---|
| Deploy a change | push to `main`; server pulls next run |
| Run now | `~/onthejob/scripts/worker-cron.sh` (or `npm run statuspage-worker` for stdout) |
| See what it would do | `npm run statuspage-worker -- --dry-run` |
| Add/remove a status page | edit `content/statuspage-sources.json`, push |
| Raise per-run cap (default 3) | `npm run statuspage-worker -- --max 5` (or edit cron wrapper) |
| Claude auth expired | log shows exit 2 → SSH in, `claude` → `/login` |
| Failed grounding | PR is opened anyway, labeled `grounding-failed` — review against source before merge |
| Post the tweet | copy the "Suggested tweet" block from the PR description, post manually — nothing is auto-posted |

Dedup is stateless — derived from merged incident files, open PR bodies, and the
discovery queue. Deleting a PR **branch without merging** makes the worker re-ingest
that incident on the next run (close the PR and merge nothing = reject by adding the
URL to `content/queue/candidates.json` with `"status": "rejected"`).
