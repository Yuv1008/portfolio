import { useEffect } from 'react'
import {
  Controller,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodTypeAny } from 'zod'
import type { FieldDescriptor } from '@portfolio/shared'
import { MarkdownEditor } from './MarkdownEditor'
import { ImageField } from './ImagePicker'
import { TagsField } from './fields/TagsField'
import { KeyValueField } from './fields/KeyValueField'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

const inputClass = (invalid: boolean): string =>
  `mt-1.5 w-full rounded-md border bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:ring-1 ${
    invalid
      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
      : 'border-neutral-800 focus:border-accent focus:ring-accent'
  }`

interface ResourceFormProps<T extends FieldValues> {
  schema: ZodTypeAny
  fields: readonly FieldDescriptor[]
  defaultValues: DefaultValues<T>
  submitLabel: string
  busy?: boolean
  onSubmit: (values: T) => Promise<void>
  onCancel: () => void
}

/**
 * One form for every content type. The descriptors decide what each field
 * looks like; the zod schema from packages/shared decides whether it is valid.
 * A new field on a model means a descriptor entry, not a new component.
 */
export const ResourceForm = <T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: ResourceFormProps<T>) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  // Closing the tab mid-edit should ask first. Navigation inside the app is
  // guarded by the dialog's own cancel handler.
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
    }
  }, [isDirty])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const name = field.name as Path<T>
          const error = errors[name]
          const message = typeof error?.message === 'string' ? error.message : undefined
          const errorId = `${field.name}-error`
          const helpId = `${field.name}-help`
          const describedBy = message ? errorId : field.help ? helpId : undefined
          const invalid = Boolean(message)
          const wide =
            field.wide ?? ['markdown', 'textarea', 'tags', 'keyvalue', 'image'].includes(field.type)

          return (
            <div key={field.name} className={wide ? 'sm:col-span-2' : undefined}>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={field.name} className="block text-sm font-medium text-neutral-300">
                  {field.label}
                </label>
                {field.type === 'slug' && field.derivesFrom ? (
                  <button
                    type="button"
                    onClick={() => {
                      const source = getValues(field.derivesFrom as Path<T>)
                      if (typeof source === 'string' && source) {
                        setValue(name, slugify(source) as never, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    }}
                    className="text-accent text-xs hover:underline"
                  >
                    Generate from {field.derivesFrom}
                  </button>
                ) : null}
              </div>

              {field.type === 'markdown' ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: controlled }) => (
                    <MarkdownEditor
                      id={field.name}
                      value={typeof controlled.value === 'string' ? controlled.value : ''}
                      onChange={controlled.onChange}
                      describedBy={describedBy}
                      invalid={invalid}
                    />
                  )}
                />
              ) : field.type === 'image' ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: controlled }) => (
                    <ImageField
                      id={field.name}
                      value={typeof controlled.value === 'string' ? controlled.value : null}
                      onChange={controlled.onChange}
                    />
                  )}
                />
              ) : field.type === 'tags' ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: controlled }) => (
                    <TagsField
                      id={field.name}
                      value={Array.isArray(controlled.value) ? (controlled.value as string[]) : []}
                      onChange={controlled.onChange}
                      placeholder={field.placeholder}
                      describedBy={describedBy}
                      invalid={invalid}
                    />
                  )}
                />
              ) : field.type === 'keyvalue' ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: controlled }) => (
                    <KeyValueField
                      id={field.name}
                      value={(controlled.value ?? {}) as Record<string, string>}
                      onChange={controlled.onChange}
                    />
                  )}
                />
              ) : field.type === 'boolean' ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: controlled }) => (
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2">
                      <input
                        id={field.name}
                        type="checkbox"
                        checked={Boolean(controlled.value)}
                        onChange={(e) => {
                          controlled.onChange(e.target.checked)
                        }}
                        className="accent-accent size-4 rounded border-neutral-700 bg-neutral-900"
                      />
                      <span className="text-sm text-neutral-400">
                        {field.placeholder ?? 'Enabled'}
                      </span>
                    </label>
                  )}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  rows={3}
                  placeholder={field.placeholder}
                  aria-invalid={invalid ? 'true' : undefined}
                  aria-describedby={describedBy}
                  {...register(name)}
                  className={inputClass(invalid)}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  aria-invalid={invalid ? 'true' : undefined}
                  aria-describedby={describedBy}
                  {...register(name)}
                  className={inputClass(invalid)}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={
                    field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
                  }
                  inputMode={field.type === 'number' ? 'numeric' : undefined}
                  min={field.min}
                  max={field.max}
                  placeholder={field.placeholder}
                  aria-invalid={invalid ? 'true' : undefined}
                  aria-describedby={describedBy}
                  {...register(name, field.type === 'number' ? { valueAsNumber: true } : {})}
                  className={inputClass(invalid)}
                />
              )}

              {message ? (
                <p id={errorId} className="mt-1.5 text-sm text-red-400">
                  {message}
                </p>
              ) : field.help ? (
                <p id={helpId} className="mt-1.5 text-xs text-neutral-500">
                  {field.help}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || busy}
          className="bg-accent hover:bg-accent-strong rounded-md px-4 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
