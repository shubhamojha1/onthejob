# Incident ingestion workflow

How a public postmortem goes from a URL to a live page on onthejob.dev.

---

## Quick reference — standard process

This is the day-to-day workflow for adding a new postmortem using Claude Code as the LLM (no API key required).

```
1. npm run queue                              — see what the bot has surfaced
2. npm run queue -- --pick <n>               — print the full URL for entry #n
3. npm run ingest-prep -- <url>              — fetch page + fill prompt
4. Paste content/queue/.pending-extract.md   — into this Claude Code chat
   Claude extracts JSON → saves to content/queue/.pending-result.json automatically
5. npm run ingest-apply -- content/queue/.pending-result.json
                                             — validate, archive, write .md, open draft PR
6. Review the draft PR on GitHub → merge when satisfied
```

The discovery bot runs daily via GitHub Actions and keeps the queue topped up — you only ever do steps 3–6 manually.

---

## Overview

```
URL → fetch page text → LLM extraction → Zod validation → archive → draft PR → human review → merge
```

There are two paths depending on whether you have an Anthropic API key:

| | Automated | Manual |
|---|---|---|
| LLM step | Claude API | Paste into Claude Code |
| Command | `npm run ingest -- <url>` | `ingest-prep` → Claude Code → `ingest-apply` |

---

## Finding candidates

The discovery bot runs daily and appends new postmortem URLs to `content/queue/candidates.json`.

```bash
# See what's in the queue
npm run queue

# Run the discovery bot manually (also runs automatically via GitHub Actions)
npm run discover
```

Pick a URL with `status: "new"` from the queue output.

---

## Path A — Automated (requires `ANTHROPIC_API_KEY`)

### 1. Set your API key

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

Get a key at [console.anthropic.com/settings/api-keys](https://console.anthropic.com/settings/api-keys). Cost per extraction: ~$0.01–0.03.

### 2. Run ingest

```bash
npm run ingest -- <url>
```

The script will:
1. Fetch the postmortem page and extract readable text
2. Send it to Claude with the prompt in `prompts/extract-incident.md`
3. Validate the output against the Zod schema — fails loud on any error
4. Save the source URL to the Internet Archive
5. Write `content/incidents/<id>.md` with `verified: false`
6. Create a git branch, commit, push, and open a **draft PR**
7. Mark the URL as `done` in the queue

### 3. Review the draft PR

Open the PR link printed by the script. The PR body shows:
- All extracted fields
- The `source_quote` — one verbatim sentence proving the extraction is faithful
- Confidence score (🟢 high / 🟡 medium / 🔴 low)

Low-confidence PRs get a `needs-review` label automatically.

Check the extracted fields against the original postmortem. Merge when satisfied.

---

## Path B — Manual (no API key needed)

Uses Claude Code as the LLM step.

### 1. Prep — fetch the page and fill the prompt

```bash
npm run ingest-prep -- <url>
```

This fetches the postmortem page, fills the extraction prompt template, and saves it to `content/queue/.pending-extract.md`. The terminal will print next steps.

### 2. Extract — paste into Claude Code

Open `content/queue/.pending-extract.md` and paste its full contents into this Claude Code session.

Claude will extract the JSON and write it directly to `content/queue/.pending-result.json` — no manual copy-paste needed.

### 3. Apply — validate, archive, write, and PR

```bash
npm run ingest-apply -- content/queue/.pending-result.json
```

This does everything from step 3 onward in Path A: Zod validation, Internet Archive, writing the `.md` file, and opening a draft PR.

### 5. Review the draft PR

Same as Path A — check the PR body against the original, merge when satisfied.

---

## After merging

The archive workflow (`.github/workflows/archive.yml`) runs automatically on merge and saves the source URL to the Internet Archive if `archive_url` is blank.

To run `npm run prebuild` (or `npm run dev`) to regenerate the JSON index and confirm the new incident appears on the home page.

---

## Tuning extraction quality

The LLM prompt lives at `prompts/extract-incident.md` and is versioned with the repo. Edit it to improve extraction — changes take effect on the next `ingest` run without touching any script code.

Key things to tune:
- **Field descriptions** — make them more specific if a field keeps coming out wrong
- **`classes[]` examples** — the allowed list is already exhaustive; do not add values here
- **`confidence` thresholds** — adjust the scoring criteria if you're getting too many low/high ratings

---

## Schema reference

All fields are defined in `src/schema/incident.ts`. The `classes[]` field must use values from `content/taxonomy.ts` exactly — the validation step will reject anything else.

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | lowercase kebab-case, e.g. `github-2024-mysql-failover` |
| `company` | ✓ | |
| `title` | ✓ | 4–10 words |
| `year` | ✓ | Integer |
| `date` | ✓ | YYYY-MM-DD |
| `duration` | ✓ | Human string, e.g. `27 min` |
| `classes` | ✓ | 1–3 values from taxonomy |
| `patterns` | ✓ | 1–5 kebab-case strings |
| `impact` | ✓ | One sentence |
| `trigger` | ✓ | |
| `mechanism` | ✓ | |
| `lesson` | ✓ | |
| `interview` | ✓ | |
| `source` | ✓ | Valid URL |
| `sourceLabel` | ✓ | |
| `source_quote` | — | One verbatim sentence from the postmortem |
| `archive_url` | — | Populated by `npm run archive` |
| `date_added` | ✓ | Set automatically by ingest scripts |
| `last_verified` | — | Set automatically by ingest scripts |
| `verified` | ✓ | Always `false` on ingestion; set to `true` manually after verification |
