'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * The site's only animation: a short fade and rise as a section scrolls in.
 * With Reduce Motion on, it renders a plain div — no transform, no opacity
 * animation — so nothing depends on movement to become readable.
 */
export const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const reduced = useReducedMotion()

  if (reduced) return <div>{children}</div>

  return (
    // data-reveal pairs with the <noscript> rule in the layout: the initial
    // opacity:0 is server-rendered, so without JS these sections would never
    // become visible at all.
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
