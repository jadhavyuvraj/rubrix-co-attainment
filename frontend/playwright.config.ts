import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? undefined : 'chrome',
    viewport: { width: 1440, height: 1050 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `${process.platform === 'win32' ? '..\\.venv\\Scripts\\python.exe' : '../.venv/bin/python'} -m uvicorn app.main:app --app-dir ../backend --host 127.0.0.1 --port 8000`,
      url: 'http://127.0.0.1:8000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
})
