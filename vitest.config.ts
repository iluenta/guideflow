import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    // Evita ejecutar copias stale de los tests dentro de worktrees de git
    // (.claude/worktrees/*) que duplicarían y ensuciarían la ejecución.
    exclude: [...configDefaults.exclude, '**/.claude/**', '**/MAQUETA/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/coverage/**',
      ],
    },
  },
  resolve: {
    // Una única copia de React en los tests: evita el dispatcher null
    // ("Cannot read properties of null (reading 'useRef')") con renderHook.
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
