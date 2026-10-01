import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // A 401 is handled by the axios interceptor, and 4xx will not improve
        // by asking again. Only retry genuine transport failures, once.
        if (error instanceof AxiosError) {
          const status = error.response?.status
          if (status && status < 500) return false
        }
        return failureCount < 1
      },
    },
    mutations: { retry: false },
  },
})
