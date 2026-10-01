import type { Service } from '@portfolio/shared'

export const ServiceList = ({ services }: { services: Service[] }) => (
  <ul className="grid gap-5 sm:grid-cols-3">
    {services.map((service) => (
      <li key={service.id} className="rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold tracking-tight">{service.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
          {service.description}
        </p>
      </li>
    ))}
  </ul>
)
