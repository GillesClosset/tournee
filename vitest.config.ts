import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: [],
    server: {
      deps: {
        // Bundle next and next-auth through Vite so bare ESM specifiers
        // (e.g. "next/server") are resolved correctly without .js extensions.
        inline: ['next', 'next-auth'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Explicit alias for the most common bare-specifier import inside next-auth
      'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
      'next/headers': path.resolve(__dirname, 'node_modules/next/headers.js'),
    },
  },
})
