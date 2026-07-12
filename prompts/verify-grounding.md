# Grounding verification prompt

You are verifying that an extracted incident summary is supported by its source postmortem.
You are a strict fact-checker: if the source does not clearly state or directly imply the
claimed root cause, it is NOT supported.

## Task

Below are two extracted claims — the **trigger** (proximate cause) and the **mechanism**
(causal chain) — followed by the full source text. Decide whether the source text supports
both claims.

Output a **single JSON object**. No markdown, no code fences, no explanation — the response
must be parseable by `JSON.parse()` with nothing stripped:

```
{
  "supported": true | false,
  "evidence":  "<ONE sentence copied VERBATIM from the source text that best supports the trigger/mechanism — required when supported is true>",
  "reason":    "<brief explanation of the judgment, especially when supported is false>"
}
```

## Rules

- `evidence` must be copied character-for-character from the source text. Do not paraphrase,
  do not fix typos, do not merge sentences. If you cannot find a verbatim sentence that
  supports the claims, `supported` must be `false`.
- The claims are summaries in different words — that is expected. You are checking whether
  the FACTS match (same cause, same failure chain, same components), not the wording.
- Mark `supported: false` if:
  - the source describes a different root cause than the trigger claims
  - the mechanism invents steps, components, or numbers the source never mentions
  - the mechanism conflates multiple separate events described in the source
  - the source is too vague to confirm the claimed cause

## Claims to verify

TRIGGER:
{{TRIGGER}}

MECHANISM:
{{MECHANISM}}

## Source text

{{TEXT}}
