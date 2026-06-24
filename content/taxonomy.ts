export const FAILURE_CLASSES = {
  "split-brain": {
    label: "Split-brain",
    color: "#A78BFA",
    desc: "A partition leaves two nodes both acting as primary — writes diverge.",
  },
  "cascade": {
    label: "Cascading failure",
    color: "#F87171",
    desc: "One component's failure overloads its neighbors until the system folds.",
  },
  "thundering-herd": {
    label: "Thundering herd",
    color: "#FBBF24",
    desc: "A synchronized surge — retries, reconnects, cache stampede — buries a resource.",
  },
  "config-change": {
    label: "Config change",
    color: "#60A5FA",
    desc: "A configuration or rule push, not a code bug, takes production down.",
  },
  "resource-exhaustion": {
    label: "Resource exhaustion",
    color: "#4ADE80",
    desc: "CPU, memory, connections, file descriptors or disk run dry.",
  },
  "bad-deploy": {
    label: "Bad deploy",
    color: "#FB923C",
    desc: "A rollout, flag flip, or migration that wasn't safely staged.",
  },
  "data-loss": {
    label: "Data loss",
    color: "#F472B6",
    desc: "Accidental deletion or replica divergence destroys or strands data.",
  },
  "dns-bgp": {
    label: "DNS / BGP",
    color: "#2DD4BF",
    desc: "Name resolution or route withdrawal makes systems unreachable.",
  },
  "dependency": {
    label: "Dependency failure",
    color: "#E879F9",
    desc: "An upstream or downstream service — internal or third-party — gives out.",
  },
  "automation-misfire": {
    label: "Automation misfire",
    color: "#38BDF8",
    desc: "A failover, autoscaler, or cleanup job does the wrong thing, confidently.",
  },
} as const

export type FailureClassKey = keyof typeof FAILURE_CLASSES
export type FailureClassMeta = (typeof FAILURE_CLASSES)[FailureClassKey]
