# systemsfailed.dev

A curated, searchable index of public engineering postmortems — organized by **failure class**, not company.

## What works

| Command | What it does |
|---|---|
| `npm run dev` | Prebuild + Vite dev server with SSR |
| `npm run build` | Schema validation → generated indexes/cards/feeds → SSG build of every route |
| `npm test` | Run unit and corpus-level regression tests |
| `npm run typecheck` | Type-check application, scripts, and content helpers without emitting files |
| `npm run preview` | Serve the production build locally on port 4173 |
| `npm run validate` | Zod schema check on all incidents (no file generation) |
| `npm run link-check` | Checks every source with HEAD/minimal GET; rejects missing or failing hosts |
| `npm run archive` | Saves source URLs to archive.org; writes back `archive_url` fields |
| `npm run discover:backfill:dry` | Preview curated-list backfill without changing the queue |

`predev` and `prebuild` are npm lifecycle hooks — the prebuild script runs automatically before `dev` and `build`.

## Adding a new incident

1. Create `content/incidents/<id>.md` — the filename becomes the incident ID (lowercase, hyphens only).

2. Add YAML frontmatter. All fields are required unless marked optional:

```yaml
---
id: company-year-slug          # matches the filename (without .md)
company: Acme Corp
title: "Short, memorable description of what broke"
year: 2022
date: "2022-03-15"             # YYYY-MM-DD
duration: "4 h 12 min"
classes: [cascade, config-change]   # at least one; from content/taxonomy.ts
patterns: [no-staged-rollout, global-blast-radius]
impact: "One sentence on blast radius — users affected, revenue, SLA."
trigger: "The immediate cause that set off the incident."
mechanism: "How the failure propagated through the system."
lesson: "The single most transferable insight from the postmortem."
interview: "A concise talking point to use in a system design interview."
source: "https://example.com/postmortem"   # must be a valid URL
sourceLabel: "Acme Engineering Blog"
source_quote: "Optional direct quote from the postmortem."   # optional
archive_url: ""    # leave blank; populated by `npm run archive`
date_added: "2026-06-25"   # today's date, YYYY-MM-DD
last_verified: "2026-06-25"   # optional
verified: false
---
```

3. Run `npm run dev` (or `npm run prebuild`). The prebuild script validates the new file against the Zod schema and fails loudly if anything is wrong. On success it regenerates the JSON index and search index — the new card appears on the home page and gets its own prerendered page at `/incident/<id>`.

### Valid failure classes

Defined in `content/taxonomy.ts`. Current set:

`split-brain` · `cascade` · `thundering-herd` · `config-change` · `resource-exhaustion` · `bad-deploy` · `data-loss` · `dns-bgp` · `dependency` · `automation-misfire`

### AI and recommendation-system incidents

AI incidents use the same failure classes and preventive patterns as the rest of the archive.
See [`docs/ai-incident-model.md`](docs/ai-incident-model.md) for the source and eligibility
rubric.

The build also publishes `/feed.xml`, `/sitemap.xml`, one page per incident, and one page per
failure class.
