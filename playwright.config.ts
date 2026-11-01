import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    channel: 'chrome',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    env: { VITE_BASE_PATH: '/', VITE_SUPABASE_URL: 'https://wids-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-public-key' },
    reuseExistingServer: false,
  },
})
