// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readPerformanceAnalytics } from "@/lib/server/analytics"
import { getAuthContext } from "@/lib/server/workspace"
import { catSections, catTopics } from "@/lib/cat-syllabus"

vi.mock("@/lib/server/workspace", () => ({ getAuthContext: vi.fn(), decodeWorkspace: vi.fn((value: unknown) => ({ ok: true, data: value })) }))
const rpc = vi.fn()
const ready = { kind: "ready" as const, context: { supabase: { rpc }, user: { id: "user" } } } as unknown as Awaited<ReturnType<typeof getAuthContext>>
const workspace = { revision: 0, today: "2026-10-10", preferences: { dailyMinutes: 60, maxTasks: 3, timezone: "Asia/Kolkata", targetDate: null }, catalog: { id: "cat-2026-v1", examCode: "cat", version: "2026.1", label: "CAT", disclaimer: "Curated", sections: catSections, groups: [], topics: catTopics }, progress: [], plans: [] }
const analytics = { windowDays: 90, windowStartedAt: "2026-01-01T00:00:00Z", startedAttempts: 0, finalizedAttempts: 0, activeAttempts: 0, completionRate: null,
  overall: { attempts: 0, totalQuestions: 0, answeredQuestions: 0, correct: 0, incorrect: 0, unanswered: 0, skipped: 0, accuracy: null }, sections: [], topics: [], scoreHistory: [], recentTrend: [], timing: { attemptsWithTiming: 0, totalElapsedSeconds: 0, averageElapsedSeconds: null, averageSecondsPerQuestion: null } }
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "error").mockImplementation(() => undefined); vi.mocked(getAuthContext).mockResolvedValue(ready); rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "read_practice_analytics" ? analytics : workspace, error: null })) })
afterEach(() => vi.restoreAllMocks())

describe("performance analytics server boundary", () => {
  it("loads only an authenticated owner-scoped projection and returns honest empty recommendations", async () => {
    const result = await readPerformanceAnalytics()
    expect(result).toMatchObject({ ok: true, data: { finalizedAttempts: 0, overall: { accuracy: null }, recommendations: [{ kind: "start_practice" }] } })
    expect(rpc).toHaveBeenCalledWith("read_practice_analytics", { p_days: 90 })
    expect(rpc).toHaveBeenCalledWith("read_cat_workspace")
  })
  it("rejects invalid windows before persistence access and hides RPC diagnostics", async () => {
    expect(await readPerformanceAnalytics(6)).toMatchObject({ ok: false, code: "validation" })
    expect(rpc).not.toHaveBeenCalled()
    rpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "private table" } })
    const failed = await readPerformanceAnalytics()
    expect(failed).toMatchObject({ ok: false, code: "database" }); expect(JSON.stringify(failed)).not.toContain("private table")
  })
  it("does not read analytics without a verified session", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ kind: "unauthenticated", message: "Sign in" })
    expect(await readPerformanceAnalytics()).toMatchObject({ ok: false, code: "unauthenticated" }); expect(rpc).not.toHaveBeenCalled()
  })
})
