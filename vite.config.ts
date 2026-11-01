import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Vite config runs in Node, before import.meta.env is available to the app.
  const { VITE_BASE_PATH = '/' } = loadEnv(mode, process.cwd(), 'VITE_')
  const base = VITE_BASE_PATH.trim() || '/'
  if (!base.startsWith('/') || !base.endsWith('/') || base.includes('//') || /[?#\\\s]/.test(base)) {
    throw new Error('VITE_BASE_PATH must be an absolute path with leading and trailing slashes, e.g. /wids/ or /.')
  }
  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  }
})
