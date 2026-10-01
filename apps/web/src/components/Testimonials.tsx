import type { Testimonial } from '@portfolio/shared'

export const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => (
  <ul className="grid gap-5 sm:grid-cols-2">
    {testimonials.map((testimonial) => (
      <li
        key={testimonial.id}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <blockquote className="text-sm leading-relaxed">“{testimonial.quote}”</blockquote>
        <figcaption className="mt-4 text-sm">
          <span className="font-medium">{testimonial.name}</span>
          <span className="text-[var(--color-muted)]">
            {' '}
            · {testimonial.role}, {testimonial.company}
          </span>
        </figcaption>
      </li>
    ))}
  </ul>
)
