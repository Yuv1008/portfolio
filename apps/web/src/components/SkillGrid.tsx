import type { Skill } from '@portfolio/shared'

export const SkillGrid = ({ skills }: { skills: Skill[] }) => {
  const byCategory = new Map<string, Skill[]>()
  for (const skill of skills) {
    const bucket = byCategory.get(skill.category)
    if (bucket) bucket.push(skill)
    else byCategory.set(skill.category, [skill])
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...byCategory].map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {category}
          </h3>
          <ul className="mt-3 space-y-2">
            {items.map((skill) => (
              <li key={skill.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">{skill.name}</span>
                <span
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`${String(skill.level)} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span
                      key={step}
                      aria-hidden
                      className={`h-1 w-4 rounded-full ${
                        step <= skill.level
                          ? 'bg-[var(--color-accent)]'
                          : 'bg-[var(--color-border)]'
                      }`}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
