import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/**
 * Flips html[data-theme], set before paint by the inline script in
 * index.html. Label is mount-gated: SSG output has no theme, so rendering
 * it during hydration would mismatch.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('sf-theme', next) } catch { /* private mode */ }
    setTheme(next)
  }

  return (
    <button
      className="oj-theme"
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={theme === 'dark'}
    >
      <i aria-hidden />
      {theme === null ? 'theme' : theme === 'dark' ? 'lights on' : 'lights out'}
    </button>
  )
}
