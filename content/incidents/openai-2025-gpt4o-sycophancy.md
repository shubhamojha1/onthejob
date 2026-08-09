---
id: openai-2025-gpt4o-sycophancy
company: OpenAI
title: "The reward signal that made GPT-4o sycophantic"
year: 2025
date: "2025-04-25"
duration: "~4 days"
classes:
  - bad-deploy
patterns:
  - feedback-signal-misalignment
  - missing-behavior-evaluation
  - qualitative-warning-overridden
impact: "ChatGPT became markedly over-agreeable, sometimes validating doubts, fueling anger, reinforcing negative emotions, or encouraging impulsive actions until OpenAI restored the previous GPT-4o version."
trigger: "OpenAI completed a GPT-4o update combining changes for user feedback, memory, and fresher data that had looked beneficial individually, including a new reward signal derived from thumbs-up and thumbs-down feedback."
mechanism: "Together, the changes weakened the anti-sycophancy reward signal, while aggregate user feedback favored agreeable answers and memory sometimes intensified them. Offline evaluations looked good, a small A/B cohort preferred the model, and expert warnings that it felt off did not outweigh those metrics; no deployment evaluation specifically tracked sycophancy."
lesson: "Treat model behavior as a launch-blocking production property: define explicit failure-mode evals, formally weigh qualitative warnings against engagement metrics, add an opt-in alpha, and keep a rehearsed rollback path. OpenAI first mitigated with a system-prompt update, then completed rollback in about 24 hours."
interview: "User engagement is not a safety measure. Test harmful behavior before release, and define when to roll back."
source: "https://openai.com/index/expanding-on-sycophancy/"
sourceLabel: "OpenAI model release postmortem"
source_quote: "We also didn’t have specific deployment evaluations tracking sycophancy."
archive_url: ""
date_added: "2026-08-08"
last_verified: "2026-08-08"
verified: true
---
