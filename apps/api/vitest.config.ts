import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    // Supertest hits one database; parallel files would fight over the same rows.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
