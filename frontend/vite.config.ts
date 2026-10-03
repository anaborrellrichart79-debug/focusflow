/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Identificador de esta compilación. Va dentro del código (__VERSION_APP__) y
// en /version.json: la app abierta compara los dos para saber si se ha
// publicado una versión nueva (AvisoVersionNueva).
const VERSION_APP = Date.now().toString(36)

function versionApp(): Plugin {
  return {
    name: 'version-app',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION_APP }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionApp()],
  define: {
    __VERSION_APP__: JSON.stringify(VERSION_APP),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/pruebas/configuracion.ts'],
  },
})
