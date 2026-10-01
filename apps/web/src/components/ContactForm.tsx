'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactInput } from '@portfolio/shared'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

const field =
  'mt-1.5 w-full rounded-md border bg-[var(--color-bg)] px-3 py-2 text-sm outline-none transition focus:ring-1'
const ok =
  'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]'
const bad = 'border-red-500/60 focus:border-red-500 focus:ring-red-500'

export const ContactForm = () => {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', body: '', company: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (res.status === 429) {
        setFormError('That is a few messages in a short time. Try again in an hour.')
        return
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setFormError(data?.error ?? 'Something went wrong. Please try again.')
        return
      }

      reset()
      setSent(true)
    } catch {
      setFormError('Could not reach the server. Please try again.')
    }
  })

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center"
      >
        <p className="text-lg font-medium tracking-tight">Thanks — that reached me.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
          I read everything and usually reply within a couple of days.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false)
          }}
          className="mt-6 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm transition hover:bg-[var(--color-bg)]"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/*
        Honeypot. Hidden from sight, removed from the tab order and from the
        accessibility tree, so only a bot filling every input will touch it.
        The API answers 201 and discards those, rather than saying it noticed.
      */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
            className={`${field} ${errors.name ? bad : ok}`}
          />
          {errors.name ? (
            <p id="name-error" className="mt-1.5 text-sm text-red-500">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
            className={`${field} ${errors.email ? bad : ok}`}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1.5 text-sm text-red-500">
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          aria-invalid={errors.subject ? 'true' : undefined}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          {...register('subject')}
          className={`${field} ${errors.subject ? bad : ok}`}
        />
        {errors.subject ? (
          <p id="subject-error" className="mt-1.5 text-sm text-red-500">
            {errors.subject.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="body"
          rows={6}
          aria-invalid={errors.body ? 'true' : undefined}
          aria-describedby={errors.body ? 'body-error' : undefined}
          {...register('body')}
          className={`${field} resize-y ${errors.body ? bad : ok}`}
        />
        {errors.body ? (
          <p id="body-error" className="mt-1.5 text-sm text-red-500">
            {errors.body.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300"
        >
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
