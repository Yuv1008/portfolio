import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

const required = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    console.error(`Cannot seed: ${name} is not set. Copy .env.example to .env first.`)
    process.exit(1)
  }
  return value
}

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

async function main() {
  const adminEmail = required('ADMIN_EMAIL').toLowerCase()
  const adminPassword = required('ADMIN_PASSWORD')

  // Every write is an upsert on a stable key, so seeding twice changes nothing.
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPassword, 12) },
    create: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12) },
  })

  const about = {
    name: 'Yuvraj Goraya',
    headline: 'Full-stack developer building web and iOS products',
    bio: [
      '## Hello',
      '',
      'I build full-stack products end to end — Spring Boot and Node services, React and Next.js front ends, and native iOS.',
      '',
      'Replace this bio from the admin panel; it accepts **markdown**, including lists and code.',
    ].join('\n'),
    avatarUrl: null,
    resumeUrl: null,
    socials: {
      github: 'https://github.com/',
      linkedin: 'https://www.linkedin.com/',
    },
    location: 'Canada',
  }

  await prisma.about.upsert({
    where: { id: 'singleton' },
    update: about,
    create: { id: 'singleton', ...about },
  })

  const skills = [
    { name: 'TypeScript', category: 'Languages', level: 5, icon: 'typescript', order: 0 },
    { name: 'Java', category: 'Languages', level: 4, icon: 'java', order: 1 },
    { name: 'Swift', category: 'Languages', level: 4, icon: 'swift', order: 2 },
    { name: 'React', category: 'Frontend', level: 5, icon: 'react', order: 3 },
    { name: 'Next.js', category: 'Frontend', level: 4, icon: 'nextdotjs', order: 4 },
    { name: 'Node.js', category: 'Backend', level: 5, icon: 'nodedotjs', order: 5 },
    { name: 'Spring Boot', category: 'Backend', level: 4, icon: 'springboot', order: 6 },
    { name: 'PostgreSQL', category: 'Data', level: 4, icon: 'postgresql', order: 7 },
    { name: 'Docker', category: 'Infrastructure', level: 3, icon: 'docker', order: 8 },
  ]
  for (const skill of skills) {
    const existing = await prisma.skill.findFirst({ where: { name: skill.name } })
    if (existing) await prisma.skill.update({ where: { id: existing.id }, data: skill })
    else await prisma.skill.create({ data: skill })
  }

  const projects = [
    {
      title: 'Text to Speech',
      slug: 'text-to-speech',
      summary:
        'Type text, pick a voice, shape speed and pitch, and get audio back. Runs fully offline, or against a cloud provider by changing one variable.',
      content: [
        '## What it does',
        '',
        'A React client with a custom audio player and waveform, and an Express API that',
        'validates every request, caches identical ones, and keeps a history of past',
        'generations.',
        '',
        '## Why it was interesting',
        '',
        '- The provider is swappable: an offline mock by default, or Google Cloud TTS or',
        '  ElevenLabs once a key is set, so the app runs with no account and no network',
        '- A janitor sweep deletes generated audio once it passes its TTL, so the disk',
        '  does not grow without bound',
        '- SQLite for history, which keeps the whole thing to one process and one file',
      ].join('\n'),
      coverImageUrl: null,
      techStack: ['React', 'Vite', 'Node.js', 'Express', 'SQLite'],
      githubUrl: 'https://github.com/Yuv1008/text-to-speech',
      liveUrl: 'https://text-to-speech-theta-one.vercel.app',
      featured: true,
      order: 0,
      published: true,
    },
    {
      title: 'Cloudstorage',
      slug: 'cloudstorage',
      summary:
        'A Google Drive-style file storage and sharing MVP, with direct-to-S3 uploads and permissions that inherit down a folder tree.',
      content: [
        '## What it does',
        '',
        'Upload, organise and share files. Uploads go straight to S3 through presigned URLs,',
        'so the API never handles the bytes. Sharing works user-to-user or by public link,',
        'and permissions inherit down the folder tree.',
        '',
        '## Why it was interesting',
        '',
        '- Full-text search across names and contents',
        '- Trash and restore, so no delete is final by accident',
        '- Per-endpoint rate limiting rather than one global cap',
      ].join('\n'),
      coverImageUrl: null,
      techStack: ['Java 17', 'Spring Boot', 'React', 'PostgreSQL', 'S3'],
      githubUrl: 'https://github.com/Yuv1008/cloudstorage',
      liveUrl: null,
      featured: true,
      order: 1,
      published: true,
    },
    {
      title: 'Draft project',
      slug: 'draft-project',
      summary: 'An unpublished row, so the published-only filter has something to hide.',
      content: 'Not ready yet.',
      coverImageUrl: null,
      techStack: ['TypeScript'],
      githubUrl: null,
      liveUrl: null,
      featured: false,
      order: 2,
      published: false,
    },
  ]
  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    })
  }

  const blogs = [
    {
      title: 'Building a CRUD factory that stays typed',
      slug: 'typed-crud-factory',
      excerpt:
        'Six resources, one router factory, and no `any` — what it takes to keep Prisma delegates typed through a generic.',
      content: [
        '## The problem',
        '',
        'Six content types with identical routes means six identical controllers, or one',
        'factory. The factory is easy until you want it typed.',
        '',
        '```ts',
        'const router = createCrudRouter({ model: "project", publicFilter: { published: true } })',
        '```',
        '',
        'The trick is constraining the generic to the delegate union rather than reaching for `any`.',
      ].join('\n'),
      coverImageUrl: null,
      tags: ['TypeScript', 'Prisma', 'API design'],
      published: true,
      publishedAt: day('2026-09-10'),
    },
    {
      title: 'Refresh token rotation, carefully',
      slug: 'refresh-token-rotation',
      excerpt:
        'Why a rotated refresh token should revoke its whole family when an old one comes back.',
      content: [
        '## Rotation',
        '',
        'Every refresh issues a new token and revokes the old one. If a revoked token is',
        'presented again, the cookie leaked — so the whole family is revoked and the user',
        'signs in again.',
      ].join('\n'),
      coverImageUrl: null,
      tags: ['Security', 'Auth'],
      published: true,
      publishedAt: day('2026-09-18'),
    },
    {
      title: 'An unpublished draft',
      slug: 'unpublished-draft',
      excerpt: 'Here so the public blog list has something to exclude.',
      content: 'Still writing.',
      coverImageUrl: null,
      tags: ['Draft'],
      published: false,
      publishedAt: null,
    },
  ]
  for (const blog of blogs) {
    await prisma.blog.upsert({ where: { slug: blog.slug }, update: blog, create: blog })
  }

  const experiences = [
    {
      company: 'Aproxa',
      role: 'Co-founder and engineer',
      location: 'Canada',
      startDate: day('2025-09-01'),
      endDate: null,
      current: true,
      description: [
        'Building an EdTech product end to end.',
        '',
        '- Own the iOS app and the web front end',
        '- Set up the API, database and deployment pipeline',
      ].join('\n'),
      order: 0,
    },
    {
      company: 'Placeholder Inc.',
      role: 'Software developer intern',
      location: 'Remote',
      startDate: day('2025-01-06'),
      endDate: day('2025-08-29'),
      current: false,
      description: 'Replace this row from the admin panel.',
      order: 1,
    },
  ]
  for (const experience of experiences) {
    const existing = await prisma.experience.findFirst({
      where: { company: experience.company, role: experience.role },
    })
    if (existing) await prisma.experience.update({ where: { id: existing.id }, data: experience })
    else await prisma.experience.create({ data: experience })
  }

  const testimonials = [
    {
      name: 'A. Reviewer',
      role: 'Engineering manager',
      company: 'Placeholder Inc.',
      quote: 'Shipped carefully, asked the right questions, and left the codebase tidier.',
      avatarUrl: null,
      order: 0,
      published: true,
    },
    {
      name: 'B. Collaborator',
      role: 'Product designer',
      company: 'Aproxa',
      quote: 'Turns a rough design into something that feels considered.',
      avatarUrl: null,
      order: 1,
      published: true,
    },
  ]
  for (const testimonial of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: testimonial.name } })
    if (existing) await prisma.testimonial.update({ where: { id: existing.id }, data: testimonial })
    else await prisma.testimonial.create({ data: testimonial })
  }

  const services = [
    {
      title: 'Full-stack web applications',
      description:
        'From the database schema through the API to a front end that holds up on a phone.',
      icon: 'layers',
      order: 0,
    },
    {
      title: 'iOS development',
      description: 'Native Swift apps, from a first prototype to something ready for review.',
      icon: 'smartphone',
      order: 1,
    },
    {
      title: 'API design and review',
      description: 'REST APIs that are validated, versioned and pleasant to consume.',
      icon: 'plug',
      order: 2,
    },
  ]
  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { title: service.title } })
    if (existing) await prisma.service.update({ where: { id: existing.id }, data: service })
    else await prisma.service.create({ data: service })
  }

  // One read and one unread, so the dashboard's unread count is not zero.
  const messages = [
    {
      name: 'Sample Visitor',
      email: 'visitor@example.com',
      subject: 'Freelance enquiry',
      body: 'Saw your portfolio and wanted to ask about availability next quarter.',
      read: false,
    },
    {
      name: 'Another Visitor',
      email: 'someone@example.com',
      subject: 'Question about Text to Speech',
      body: 'How did you make the TTS provider swappable without the client knowing?',
      read: true,
    },
  ]
  for (const message of messages) {
    const existing = await prisma.message.findFirst({
      where: { email: message.email, subject: message.subject },
    })
    if (!existing) await prisma.message.create({ data: message })
  }

  const counts = {
    users: await prisma.user.count(),
    about: await prisma.about.count(),
    skills: await prisma.skill.count(),
    projects: await prisma.project.count(),
    blogs: await prisma.blog.count(),
    experience: await prisma.experience.count(),
    testimonials: await prisma.testimonial.count(),
    services: await prisma.service.count(),
    messages: await prisma.message.count(),
    media: await prisma.media.count(),
  }

  console.log(`\nSeeded. Admin: ${admin.email}\n`)
  for (const [model, count] of Object.entries(counts)) {
    console.log(`  ${model.padEnd(14)} ${count}`)
  }
  console.log('')
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
