import Link from 'next/link'
import Image from 'next/image'
import {
  getAbout,
  getExperience,
  getFeaturedProjects,
  getServices,
  getSkills,
  getTestimonials,
} from '@/lib/api'
import cloudinaryLoader from '@/lib/cloudinary'
import { Section } from '@/components/Section'
import { ProjectCard } from '@/components/ProjectCard'
import { SkillGrid } from '@/components/SkillGrid'
import { Timeline } from '@/components/Timeline'
import { Testimonials } from '@/components/Testimonials'
import { ServiceList } from '@/components/ServiceList'
import { Reveal } from '@/components/Reveal'

export default async function Home() {
  // One round of parallel reads rather than a waterfall down the page.
  const [about, projects, skills, experience, testimonials, services] = await Promise.all([
    getAbout(),
    getFeaturedProjects(),
    getSkills(),
    getExperience(),
    getTestimonials(),
    getServices(),
  ])

  return (
    <>
      <section className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {about?.name ?? 'Portfolio'}
          </h1>
          <p className="mt-4 text-balance text-lg leading-relaxed text-[var(--color-muted)]">
            {about?.headline ?? 'Set up your About record in the admin panel.'}
          </p>
          {about?.location ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{about.location}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] transition hover:opacity-90"
            >
              See my work
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)]"
            >
              Get in touch
            </Link>
            {about?.resumeUrl ? (
              <a
                href={about.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)]"
              >
                Résumé
              </a>
            ) : null}
          </div>
        </div>

        {about?.avatarUrl ? (
          <Image
            loader={cloudinaryLoader}
            src={about.avatarUrl}
            alt={about.name}
            width={120}
            height={120}
            className="size-28 shrink-0 rounded-full border border-[var(--color-border)] object-cover sm:size-32"
            priority
          />
        ) : null}
      </section>

      {projects.length > 0 ? (
        <Reveal>
          <Section
            title="Featured work"
            description="A few things I have built."
            action={
              <Link href="/projects" className="text-sm text-[var(--color-accent)] hover:underline">
                All projects
              </Link>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Section>
        </Reveal>
      ) : null}

      {skills.length > 0 ? (
        <Reveal>
          <Section title="Skills" description="What I reach for.">
            <SkillGrid skills={skills} />
          </Section>
        </Reveal>
      ) : null}

      {experience.length > 0 ? (
        <Reveal>
          <Section title="Experience">
            <Timeline roles={experience} />
          </Section>
        </Reveal>
      ) : null}

      {services.length > 0 ? (
        <Reveal>
          <Section title="What I can help with">
            <ServiceList services={services} />
          </Section>
        </Reveal>
      ) : null}

      {testimonials.length > 0 ? (
        <Reveal>
          <Section title="Kind words">
            <Testimonials testimonials={testimonials} />
          </Section>
        </Reveal>
      ) : null}

      <Reveal>
        <Section title="Let's build something">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-lg font-medium tracking-tight">Have a project in mind?</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
              I am open to freelance work and interesting conversations.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] transition hover:opacity-90"
            >
              Start a conversation
            </Link>
          </div>
        </Section>
      </Reveal>
    </>
  )
}
