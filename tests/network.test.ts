// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { SUPABASE_REQUEST_TIMEOUT_MS, supabaseFetch } from "@/lib/supabase/fetch"

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
describe("bounded Supabase transport", () => {
  it("aborts a stalled request and releases its timer", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true })
    })))
    const request = supabaseFetch("http://127.0.0.1/unreachable")
    const rejected = expect(request).rejects.toThrow("aborted")
    await vi.advanceTimersByTimeAsync(SUPABASE_REQUEST_TIMEOUT_MS)
    await rejected
    expect(vi.getTimerCount()).toBe(0)
  })
  it("keeps caller cancellation instead of replacing it with a timeout", async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    controller.abort()
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"))
    vi.stubGlobal("fetch", transport)
    await supabaseFetch("http://127.0.0.1/test", { signal: controller.signal })
    expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
  it("also bounds a response whose headers arrive but body stalls", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(new Response(new ReadableStream({
      start(controller) { init?.signal?.addEventListener("abort", () => controller.error(new Error("body aborted")), { once: true }) },
    })))))
    const request = supabaseFetch("http://127.0.0.1/stalled-body")
    const rejected = expect(request).rejects.toThrow("body aborted")
    await vi.advanceTimersByTimeAsync(SUPABASE_REQUEST_TIMEOUT_MS)
    await rejected
    expect(vi.getTimerCount()).toBe(0)
  })
})
