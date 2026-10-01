import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  id?: string
}

export const Section = ({ title, description, action, children, id }: SectionProps) => (
  <section id={id} className="mt-20">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
)
