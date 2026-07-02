/**
 * Build step: generate 1200×630 share cards → public/cards/<id>.png
 * plus the site-wide public/og-image.png.
 *
 * Design mirrors the site: white card, uptime tick strip with the red
 * segment where the incident hit, Archivo display type, mono metadata.
 *
 * Skips cards that already exist; pass --force to regenerate everything.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { FAILURE_CLASSES } from '../content/taxonomy.js'
import { splitMetrics } from '../src/lib/metrics.js'
import type { Incident } from '../src/schema/incident.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CARDS_DIR = join(ROOT, 'public', 'cards')
const FORCE = process.argv.includes('--force')

mkdirSync(CARDS_DIR, { recursive: true })

const incidents: Incident[] = JSON.parse(
  readFileSync(join(ROOT, 'src', 'generated', 'incidents-all.json'), 'utf-8'),
)

// ── Palette (kept in sync with src/styles/global.css tokens) ──────────────
const INK = '#141A21'
const MUTED = '#57626E'
const FAINT = '#8B96A2'
const LINE = '#DFE4E9'
const OK_DIM = '#BFD9C8'
const DOWN = '#E0343F'
const DOWN_INK = '#B8232D'
const PAPER = '#F2F4F6'

function font(pkg: string, file: string) {
  return readFileSync(join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file))
}

const fonts = [
  { name: 'Archivo', weight: 800 as const, style: 'normal' as const, data: font('archivo', 'archivo-latin-800-normal.woff') },
  { name: 'Public Sans', weight: 400 as const, style: 'normal' as const, data: font('public-sans', 'public-sans-latin-400-normal.woff') },
  { name: 'IBM Plex Mono', weight: 600 as const, style: 'normal' as const, data: font('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff') },
]

// ── Hex color mixing (stand-in for CSS color-mix on light surfaces) ───────
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v * t + pb[i] * (1 - t)).toString(16).padStart(2, '0')).join('')
}

// ── Tick strip geometry (same rules as src/components/TickStrip.tsx) ──────
function severityTicks(duration: string): number {
  const d = duration.toLowerCase()
  if (/\d+\s*(day|week|month)/.test(d)) return 3
  const h = d.match(/(\d+(?:\.\d+)?)\s*h/)
  if (h && parseFloat(h[1]) >= 3) return 2
  return 1
}

function tickStrip(i: Incident, ticks = 40) {
  const [, m, day] = i.date.split('-').map(Number)
  const start = Math.min(ticks - 1, Math.round((((m - 1) * 30.4 + (day || 1)) / 365) * ticks))
  const len = severityTicks(i.duration)
  return {
    type: 'div',
    props: {
      style: { display: 'flex', gap: 5, width: '100%' },
      children: Array.from({ length: ticks }, (_, idx) => ({
        type: 'div',
        props: {
          style: {
            flexGrow: 1,
            height: idx >= start && idx < start + len ? 34 : 22,
            marginTop: idx >= start && idx < start + len ? 0 : 6,
            borderRadius: 2,
            background: idx >= start && idx < start + len ? DOWN : OK_DIM,
          },
        },
      })),
    },
  }
}

/** The brand mark: the favicon's tick strip — green bars, one red tick. */
function logoMark(size: number) {
  const w = size * 0.17
  const gap = size * 0.11
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center', gap, height: size },
      children: [0, 1, 2, 3, 4].map(idx => ({
        type: 'div',
        props: {
          style: {
            width: w,
            height: idx === 3 ? size : size * 0.62,
            borderRadius: w / 2,
            background: idx === 3 ? DOWN : '#8FBC9F', // favicon's green
          },
        },
      })),
    },
  }
}

function wordmark(fontSize: number, color: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: fontSize * 0.5,
        fontFamily: 'IBM Plex Mono',
        fontSize,
        fontWeight: 600,
        color,
      },
      children: [logoMark(fontSize * 0.95), { type: 'div', props: { style: { display: 'flex' }, children: 'systemsfailed.dev' } }],
    },
  }
}

function chip(label: string, color: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        padding: '7px 16px',
        borderRadius: 8,
        border: `2px solid ${mix(color, LINE, 0.38)}`,
        background: mix(color, '#FFFFFF', 0.12),
        color: mix(color, INK, 0.42),
        fontFamily: 'IBM Plex Mono',
        fontSize: 19,
        fontWeight: 600,
      },
      children: label,
    },
  }
}

/**
 * Impact copy with metrics as red mono readouts. Satori can't flow mixed
 * inline styles, so each word is a flex item (wrapping stays natural) and
 * the text is pre-truncated to about two lines in place of lineClamp.
 */
function impactLine(text: string, maxChars = 175) {
  if (text.length > maxChars) {
    text = text.slice(0, text.lastIndexOf(' ', maxChars)).replace(/[,;:.]$/, '') + ' …'
  }
  const words: { text: string; metric: boolean }[] = []
  for (const seg of splitMetrics(text)) {
    for (const w of seg.text.split(/\s+/)) {
      if (w) words.push({ text: w, metric: seg.metric })
    }
  }
  // Re-join adjacent metric words ("75", "minutes") so they never wrap apart,
  // and glue bare punctuation onto the word before it
  const items: { text: string; metric: boolean }[] = []
  for (const w of words) {
    const prev = items[items.length - 1]
    if (w.metric && prev?.metric) prev.text += ' ' + w.text
    else if (prev && /^[,.;:!?)\]…]+$/.test(w.text)) prev.text += w.text
    else items.push(w)
  }
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: 7,
        rowGap: 4,
        marginTop: 20,
        fontFamily: 'Public Sans',
        fontSize: 25,
        lineHeight: 1.3,
        color: INK,
      },
      children: items.map(w => ({
        type: 'div',
        props: {
          style: w.metric
            ? { display: 'flex', fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: 23, color: DOWN_INK }
            : { display: 'flex' },
          children: w.text,
        },
      })),
    },
  }
}

function incidentCard(i: Incident) {
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        padding: 26,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              border: `2px solid ${LINE}`,
              borderRadius: 18,
              padding: '42px 52px 40px',
            },
            children: [
              tickStrip(i),
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 26,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 22,
                    fontWeight: 600,
                    color: MUTED,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', color: INK, textTransform: 'uppercase', letterSpacing: 1.5 },
                        children: i.company,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', color: FAINT },
                        children: `${i.date} · ${i.duration}`,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 18,
                    fontFamily: 'Archivo',
                    fontSize: 58,
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: -1.5,
                    color: INK,
                    lineClamp: 3,
                  },
                  children: i.title,
                },
              },
              impactLine(i.impact),
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 24,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', gap: 12 },
                        children: i.classes.slice(0, 2).map(c =>
                          chip(FAILURE_CLASSES[c].label, FAILURE_CLASSES[c].color),
                        ),
                      },
                    },
                    wordmark(22, DOWN_INK),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  }
}

function siteCard(count: number, yearMin: number, yearMax: number) {
  // A master strip with red ticks scattered where the record has incidents
  const total = 52
  const hits = new Set<number>()
  for (const i of incidents) {
    const [y, m] = i.date.split('-').map(Number)
    hits.add(Math.min(total - 1, Math.floor(((y - yearMin + (m - 1) / 12) / (yearMax - yearMin + 1)) * total)))
  }
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: PAPER,
        padding: '0 80px',
      },
      children: [
        wordmark(24, DOWN_INK),
        {
          type: 'div',
          props: {
            style: {
              marginTop: 22,
              fontFamily: 'Archivo',
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2.5,
              color: INK,
            },
            children: "Every status page turns green again. This one doesn't.",
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', gap: 6, marginTop: 52 },
            children: Array.from({ length: total }, (_, idx) => ({
              type: 'div',
              props: {
                style: {
                  flexGrow: 1,
                  height: hits.has(idx) ? 56 : 40,
                  marginTop: hits.has(idx) ? 0 : 8,
                  borderRadius: 3,
                  background: hits.has(idx) ? DOWN : OK_DIM,
                },
              },
            })),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 16,
              fontFamily: 'IBM Plex Mono',
              fontSize: 21,
              color: FAINT,
            },
            children: [
              { type: 'div', props: { style: { display: 'flex' }, children: `${yearMin}` } },
              { type: 'div', props: { style: { display: 'flex', color: MUTED }, children: `${count} postmortems, indexed by failure class` } },
              { type: 'div', props: { style: { display: 'flex' }, children: `${yearMax}` } },
            ],
          },
        },
      ],
    },
  }
}

async function render(node: object, outPath: string) {
  const svg = await satori(node as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  writeFileSync(outPath, png)
}

let made = 0
for (const i of incidents) {
  const out = join(CARDS_DIR, `${i.id}.png`)
  if (!FORCE && existsSync(out)) continue
  await render(incidentCard(i), out)
  made++
}

const years = incidents.map(i => i.year)
await render(
  siteCard(incidents.length, Math.min(...years), Math.max(...years)),
  join(ROOT, 'public', 'og-image.png'),
)

console.log(`✓ Share cards: ${made} generated, ${incidents.length - made} cached → public/cards/`)
console.log('✓ Site og-image.png regenerated')
