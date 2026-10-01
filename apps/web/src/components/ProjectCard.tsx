import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@portfolio/shared'
import cloudinaryLoader from '@/lib/cloudinary'

export const ProjectCard = ({
  project,
  headingLevel = 3,
}: {
  project: Project
  /** 2 on the projects listing, where the card sits directly under the h1. */
  headingLevel?: 2 | 3
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:border-[var(--color-accent)]">
      {project.coverImageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--color-bg)]">
          <Image
            loader={cloudinaryLoader}
            src={project.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <Heading className="text-base font-semibold tracking-tight">
          {/* Stretched link: the whole card is the hit area, one link in the a11y tree */}
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </Heading>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {project.summary}
        </p>

        {project.techStack.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 5).map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
