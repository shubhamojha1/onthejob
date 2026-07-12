You are ingesting a postmortem into onthejob.dev. $ARGUMENTS is the URL.

Follow these steps in order — do not skip any, do not ask for confirmation between steps:

## Step 1 — Fetch the page
Run `npm run ingest-prep -- $ARGUMENTS` in the terminal. This fetches the page and saves the filled extraction prompt to `content/queue/.pending-extract.md`.

## Step 2 — Read the prompt
Read the file `content/queue/.pending-extract.md` in full.

## Step 3 — Extract structured JSON
Using the schema and rules in the prompt you just read, extract a single JSON object for this incident. Output nothing except the raw JSON — no markdown fences, no explanation.

Rules (non-negotiable):
- `classes[]` must only contain values from the exact list in the prompt — no invented values
- Every field except `source`, `sourceLabel`, and `source_quote` must be in your own words
- `source_quote` is one verbatim sentence from the postmortem only
- If the page is not a real postmortem, write `{"error": "<reason>"}` and stop

## Step 4 — Save the JSON
Write the extracted JSON object to `content/queue/.pending-result.json` using the Write tool. The file must contain only the raw JSON — no fences.

## Step 5 — Apply
Run `npm run ingest-apply -- content/queue/.pending-result.json` in the terminal.

If schema validation fails, show the exact errors and fix the JSON in `.pending-result.json`, then re-run ingest-apply.

## Step 6 — Report
Tell the user:
- The incident id and title that was written
- Whether the archive URL was captured
- Whether a draft PR was created (or to commit manually if gh CLI is not available)
