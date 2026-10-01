import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAbout, getExperience, getSkills } from '@/lib/api'
import cloudinaryLoader from '@/lib/cloudinary'
import { Prose } from '@/components/Markdown'
import { Section } from '@/components/Section'
import { SkillGrid } from '@/components/SkillGrid'
import { Timeline } from '@/components/Timeline'

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout()
  return {
    alternates: { canonical: '/about' },
    title: 'About',
    description: about?.headline ?? 'About me',
  }
}

export default async function AboutPage() {
  const [about, skills, experience] = await Promise.all([getAbout(), getSkills(), getExperience()])
  if (!about) notFound()

  return (
    <>
      <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">{about.name}</h1>
          <p className="mt-2 text-balance text-lg text-[var(--color-muted)]">{about.headline}</p>
          {about.location ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{about.location}</p>
          ) : null}
        </div>
        {about.avatarUrl ? (
          <Image
            loader={cloudinaryLoader}
            src={about.avatarUrl}
            alt={about.name}
            width={112}
            height={112}
            className="size-24 shrink-0 rounded-full border border-[var(--color-border)] object-cover"
          />
        ) : null}
      </header>

      <div className="mt-10 max-w-2xl">
        <Prose>{about.bio}</Prose>
      </div>

      {about.resumeUrl ? (
        <a
          href={about.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)]"
        >
          Download résumé
        </a>
      ) : null}

      {skills.length > 0 ? (
        <Section title="Skills">
          <SkillGrid skills={skills} />
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <Timeline roles={experience} />
        </Section>
      ) : null}
    </>
  )
}
