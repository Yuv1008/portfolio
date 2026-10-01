import type { Metadata } from 'next'
import { getProjects } from '@/lib/api'
import { ProjectCard } from '@/components/ProjectCard'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Things I have designed and built.',
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-[var(--color-muted)]">Things I have designed and built.</p>
      </header>

      {projects.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-muted)]">
          No published projects yet.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  )
}
