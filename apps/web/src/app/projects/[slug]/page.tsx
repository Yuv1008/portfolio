import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject, getProjects } from '@/lib/api'
import cloudinaryLoader from '@/lib/cloudinary'
import { Prose } from '@/components/Markdown'
import { JsonLd, breadcrumbSchema } from '@/components/JsonLd'

const SITE = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3010'

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Project not found' }

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary,
      type: 'article',
      ...(project.coverImageUrl ? { images: [project.coverImageUrl] } : {}),
    },
  }
}

export default async function ProjectPage({ params }: PageProps<'/projects/[slug]'>) {
  const { slug } = await params
  const project = await getProject(slug)
  // An unpublished or missing project is a 404 either way.
  if (!project) notFound()

  return (
    <article className="mx-auto max-w-2xl">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: SITE },
          { name: 'Projects', url: `${SITE}/projects` },
          { name: project.title, url: `${SITE}/projects/${project.slug}` },
        ])}
      />
      <Link href="/projects" className="text-sm text-[var(--color-muted)] hover:underline">
        ← All projects
      </Link>

      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight">{project.title}</h1>
      <p className="mt-3 text-balance text-lg text-[var(--color-muted)]">{project.summary}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Source
          </a>
        ) : null}
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Live site
          </a>
        ) : null}
      </div>

      {project.techStack.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]"
            >
              {tech}
            </li>
          ))}
        </ul>
      ) : null}

      {project.coverImageUrl ? (
        <Image
          loader={cloudinaryLoader}
          src={project.coverImageUrl}
          alt=""
          width={1200}
          height={675}
          sizes="(min-width: 768px) 42rem, 100vw"
          className="mt-8 w-full rounded-xl border border-[var(--color-border)] object-cover"
          priority
        />
      ) : null}

      <div className="mt-10">
        <Prose>{project.content}</Prose>
      </div>
    </article>
  )
}
