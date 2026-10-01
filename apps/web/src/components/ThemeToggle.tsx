'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

const apply = (theme: Theme): void => {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

const LABEL: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' }
const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('system')
  // The server cannot know the stored choice, so the control renders its real
  // label only after mount. The class itself is set earlier by the head script.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') setTheme(stored)
    } catch {
      // Private mode or blocked storage: stay on system.
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Not fatal; the choice just will not survive a reload.
    }
  }, [theme, mounted])

  // Following the OS while on 'system' means reacting to it changing.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      apply('system')
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [theme])

  return (
    <button
      type="button"
      onClick={() => {
        setTheme((current) => NEXT[current])
      }}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]]}.`}
      className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-fg)]"
    >
      {mounted ? LABEL[theme] : 'Theme'}
    </button>
  )
}

/**
 * Runs before first paint, so a dark-mode visitor never sees a white flash.
 * Inlined as a string because it must execute before React hydrates.
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var dark = stored === 'dark' || ((!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`
