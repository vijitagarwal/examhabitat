import { defineConfig, devices } from "@playwright/test"

const authenticated = process.env.CAT_E2E_AUTH === "1"
if (authenticated) {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://invalid")
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.CAT_E2E_EMAIL || !process.env.CAT_E2E_PASSWORD) {
    throw new Error("Authenticated E2E requires a loopback Supabase URL, public key, and disposable local test-account credentials.")
  }
}
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "off", // Authenticated runs must not write session cookies/tokens into traces.
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: authenticated ? {} : { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
