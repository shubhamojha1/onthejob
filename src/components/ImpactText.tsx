import { splitMetrics } from '../lib/metrics'

/** Impact copy with its metrics set as red mono readouts. */
export function ImpactText({ text }: { text: string }) {
  return (
    <>
      {splitMetrics(text).map((s, idx) =>
        s.metric ? (
          <em key={idx} className="oj-metric">{s.text}</em>
        ) : (
          <span key={idx}>{s.text}</span>
        ),
      )}
    </>
  )
}
