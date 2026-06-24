import { z } from 'zod'
import { FAILURE_CLASSES } from '../../content/taxonomy'

const failureClassKeys = Object.keys(FAILURE_CLASSES) as [
  keyof typeof FAILURE_CLASSES,
  ...Array<keyof typeof FAILURE_CLASSES>,
]

export const IncidentSchema = z.object({
  id:          z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
  company:     z.string().min(1),
  title:       z.string().min(1),
  year:        z.number().int().min(2000).max(2030),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  duration:    z.string().min(1),
  classes:     z.array(z.enum(failureClassKeys)).min(1),
  patterns:    z.array(z.string()).min(1),
  impact:      z.string().min(1),
  trigger:     z.string().min(1),
  mechanism:   z.string().min(1),
  lesson:      z.string().min(1),
  interview:   z.string().min(1),
  source:      z.string().url(),
  sourceLabel: z.string().min(1),
  // Provenance — populated by scripts/archive.ts or on human review
  source_quote:  z.string().optional(),
  archive_url:   z.union([z.string().url(), z.literal('')]).optional(),
  date_added:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_added must be YYYY-MM-DD'),
  last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  verified:      z.boolean(),
})

export type Incident = z.infer<typeof IncidentSchema>
