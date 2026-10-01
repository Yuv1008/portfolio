import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aboutUpdateSchema, field, type About as AboutRow } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import { ResourceForm } from '../components/ResourceForm'
import { useToast } from '../components/Toast'
import { Skeleton } from '../components/Skeleton'
import { ErrorState } from '../components/EmptyState'
import { AxiosError } from 'axios'

const FIELDS = [
  field({ name: 'name', label: 'Name', type: 'text' }),
  field({
    name: 'headline',
    label: 'Headline',
    type: 'text',
    help: 'One line, shown under your name',
  }),
  field({ name: 'location', label: 'Location', type: 'text' }),
  field({ name: 'avatarUrl', label: 'Avatar', type: 'image' }),
  field({
    name: 'resumeUrl',
    label: 'Résumé URL',
    type: 'url',
    help: 'A link visitors can download',
  }),
  field({ name: 'socials', label: 'Social links', type: 'keyvalue' }),
  field({ name: 'bio', label: 'Bio', type: 'markdown' }),
] as const

const EMPTY = {
  name: '',
  headline: '',
  bio: '',
  avatarUrl: null,
  resumeUrl: null,
  socials: {},
  location: '',
}

export default function About() {
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const about = useQuery({
    queryKey: ['about'],
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get<AboutRow>('/about', { signal })
        return res.data
      } catch (error) {
        // Nothing saved yet is a normal first-run state, not a failure.
        if (error instanceof AxiosError && error.response?.status === 404) return null
        throw error
      }
    },
  })

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const res = await api.put<AboutRow>('/about', values)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['about'] })
      notify('About saved', 'success')
    },
    onError: (error) => {
      notify(errorMessage(error), 'error')
    },
  })

  const defaults = about.data
    ? {
        name: about.data.name,
        headline: about.data.headline,
        bio: about.data.bio,
        avatarUrl: about.data.avatarUrl ?? null,
        resumeUrl: about.data.resumeUrl ?? null,
        socials: about.data.socials,
        location: about.data.location ?? '',
      }
    : EMPTY

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">About</h1>
        <p className="mt-1 text-sm text-neutral-500">
          The single record behind your hero and about page.
        </p>
      </header>

      {about.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : about.error ? (
        <ErrorState
          message={errorMessage(about.error)}
          onRetry={() => {
            void about.refetch()
          }}
        />
      ) : (
        <ResourceForm
          schema={aboutUpdateSchema}
          fields={FIELDS}
          defaultValues={defaults}
          submitLabel="Save about"
          busy={save.isPending}
          onCancel={() => {
            void about.refetch()
          }}
          onSubmit={async (values) => {
            await save.mutateAsync(values as Record<string, unknown>)
          }}
        />
      )}
    </div>
  )
}
