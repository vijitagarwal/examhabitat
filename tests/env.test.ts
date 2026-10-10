import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })
describe("Supabase configuration", () => {
  it.each([undefined, "", "not a URL", "file:///unsafe"])("shows setup for invalid configuration %s", async (url) => {
    vi.resetModules()
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url)
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-placeholder")
    const { hasSupabaseEnv, env } = await import("@/lib/env")
    expect(hasSupabaseEnv).toBe(false)
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined()
  })
})
