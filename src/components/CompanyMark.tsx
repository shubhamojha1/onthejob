import {
  siAllegro,
  siBasecamp,
  siChef,
  siCircleci,
  siCloudflare,
  siDatadog,
  siDiscord,
  siFastly,
  siGithub,
  siGitlab,
  siMeta,
  siRoblox,
} from 'simple-icons'
import { colorForCompany } from '../../content/taxonomy'

// Monochrome brand marks (simple-icons, CC0). Companies without one —
// including AWS and Slack, removed upstream over trademark claims — fall
// back to a lettermark in the company's hashed color.
const MARKS: Record<string, { path: string }> = {
  Allegro: siAllegro,
  Basecamp: siBasecamp,
  Chef: siChef,
  CircleCI: siCircleci,
  Cloudflare: siCloudflare,
  Datadog: siDatadog,
  Discord: siDiscord,
  Fastly: siFastly,
  GitHub: siGithub,
  GitLab: siGitlab,
  Meta: siMeta,
  Roblox: siRoblox,
}

export function CompanyMark({ company }: { company: string }) {
  const icon = MARKS[company]
  if (icon) {
    return (
      <svg className="oj-mark" viewBox="0 0 24 24" aria-hidden>
        <path d={icon.path} />
      </svg>
    )
  }
  return (
    <span
      className="oj-mark oj-monogram"
      style={{ '--c': colorForCompany(company) } as React.CSSProperties}
      aria-hidden
    >
      {company[0].toUpperCase()}
    </span>
  )
}
