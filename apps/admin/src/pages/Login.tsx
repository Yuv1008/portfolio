import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@portfolio/shared'
import { useAuth } from '../lib/auth-context'
import { errorMessage } from '../lib/api'
import { FullPageSpinner } from '../components/Skeleton'

export default function Login() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status === 'loading') return <FullPageSpinner label="Checking your session" />
  if (status === 'authed') {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      void navigate(from, { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    }
  })

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Portfolio CMS</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to manage your content.</p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              className="focus:border-accent focus:ring-accent mt-1.5 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:ring-1"
            />
            {errors.email ? (
              <p id="email-error" className="mt-1.5 text-sm text-red-400">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
              className="focus:border-accent focus:ring-accent mt-1.5 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:ring-1"
            />
            {errors.password ? (
              <p id="password-error" className="mt-1.5 text-sm text-red-400">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-strong w-full rounded-md px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
