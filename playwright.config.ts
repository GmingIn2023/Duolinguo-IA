import { defineConfig, devices } from "@playwright/test";

// In proxied sandboxes, route only external traffic (Supabase) through the proxy.
// Playwright's own `proxy` option forces loopback through the proxy too, so pass Chromium flags instead.
const args = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=localhost;127.0.0.1"] : [];

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    launchOptions: { args, executablePath: process.env.PW_CHROMIUM || undefined },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
