/**
 * Escape a string for use as XML text or an attribute value.
 * `&` must be replaced first, or the entities emitted below get double-escaped.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
