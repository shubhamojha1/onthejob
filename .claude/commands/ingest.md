Run `npm run ingest -- $ARGUMENTS` in the terminal.

$ARGUMENTS is the postmortem URL to extract. The script will:
1. Fetch the page and extract readable text
2. Call Claude to extract structured fields matching the incident schema
3. Validate against Zod — fail loud if any field is wrong or any classes[] value is not in the taxonomy
4. Save the source to the Internet Archive
5. Write content/incidents/<id>.md
6. Create a draft PR on GitHub for human review

If the command fails due to a schema validation error, show the errors clearly and suggest the user either re-run with a better URL or file the incident manually using the template in README.md.

If ANTHROPIC_API_KEY is not set, tell the user to set it: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`
