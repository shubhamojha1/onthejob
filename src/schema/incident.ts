import { z } from 'zod'
import { FAILURE_CLASSES } from '../../content/taxonomy'

const failureClassKeys = Object.keys(FAILURE_CLASSES) as [
  keyof typeof FAILURE_CLASSES,
  ...Array<keyof typeof FAILURE_CLASSES>,
]

const calendarDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
  .refine(value => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day
  }, 'date must be a real calendar date')

function uniqueValues<T extends z.ZodTypeAny>(schema: T, label: string, maximum: number) {
  return z.array(schema).min(1).max(maximum).refine(
    values => new Set(values).size === values.length,
    `${label} must not contain duplicates`,
  )
}

export const IncidentSchema = z.object({
  id:          z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
  company:     z.string().min(1),
  title:       z.string().min(1),
  year:        z.number().int().min(2000).max(2030),
  date:        calendarDate,
  duration:    z.string().min(1),
  classes:     uniqueValues(z.enum(failureClassKeys), 'classes', 3),
  patterns:    uniqueValues(z.string().regex(/^[a-z0-9-]+$/, 'patterns must be kebab-case'), 'patterns', 5),
  impact:      z.string().min(1),
  trigger:     z.string().min(1),
  mechanism:   z.string().min(1),
  lesson:      z.string().min(1),
  // A concise talking point for system design interviews. Voice is guided at
  // extraction time; the schema validates content shape, not English grammar.
  interview:   z.string().min(1),
  source:      z.string().url(),
  sourceLabel: z.string().min(1),
  // Provenance — populated by scripts/archive.ts or on human review
  source_quote:  z.string().optional(),
  archive_url:   z.union([z.string().url(), z.literal('')]).optional(),
  date_added:    calendarDate,
  last_verified: calendarDate.optional(),
  verified:      z.boolean(),
})

export type Incident = z.infer<typeof IncidentSchema>

export type InterviewIndexEntry = Pick<
  Incident,
  | 'id'
  | 'company'
  | 'year'
  | 'title'
  | 'classes'
  | 'patterns'
  | 'lesson'
  | 'mechanism'
  | 'interview'
>
