import type { Experience } from '@portfolio/shared'
import { monthYear } from '@/lib/format'
import { Prose } from './Markdown'

export const Timeline = ({ roles }: { roles: Experience[] }) => (
  <ol className="relative space-y-10 border-l border-[var(--color-border)] pl-6">
    {roles.map((role) => (
      <li key={role.id} className="relative">
        <span
          aria-hidden
          className="absolute -left-[1.655rem] top-1.5 size-2.5 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-accent)]"
        />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="text-base font-semibold tracking-tight">
            {role.role} · {role.company}
          </h3>
          <p className="text-sm text-[var(--color-muted)]">
            {monthYear(role.startDate)} –{' '}
            {role.current ? 'Present' : monthYear(role.endDate ?? new Date())}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{role.location}</p>
        <div className="mt-3 text-sm">
          <Prose>{role.description}</Prose>
        </div>
      </li>
    ))}
  </ol>
)
