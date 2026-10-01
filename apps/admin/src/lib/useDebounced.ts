import { useEffect, useState } from 'react'

/** Keeps a keystroke from becoming a request. */
export const useDebounced = <T>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delay)
    return () => {
      window.clearTimeout(timer)
    }
  }, [value, delay])

  return debounced
}
