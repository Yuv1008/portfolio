export const monthYear = (value: Date | string): string =>
  new Date(value).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

export const fullDate = (value: Date | string): string =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** Roughly 200 words a minute, rounded up, minimum one. */
export const readingTime = (markdown: string): number =>
  Math.max(1, Math.round(markdown.trim().split(/\s+/).length / 200))
