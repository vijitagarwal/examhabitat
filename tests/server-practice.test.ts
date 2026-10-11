// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { browsePractice, commandPractice, readPractice, startPractice } from "@/lib/server/practice"
import { getAuthContext } from "@/lib/server/workspace"
import { attemptSchema } from "@/lib/practice"

vi.mock("@/lib/server/workspace", () => ({ getAuthContext: vi.fn() }))
const rpc = vi.fn()
const ready = { kind: "ready" as const, context: { supabase: { rpc }, user: { id: "user" } } } as unknown as Awaited<ReturnType<typeof getAuthContext>>
const attempt = { id: "00000000-0000-4000-8000-000000000001", status: "active", mode: "practice", revision: 0, startedAt: "2026-10-10T01:00:00Z", deadline: null, finishedAt: null, serverNow: "2026-10-10T01:00:00Z", policy: { version: "practice-v1", correct: 3, mcqPenalty: 1, numericPenalty: 0 }, result: null, items: [{ question: { id: "cat-p-017", version: 1, section: "QA", topicId: "topic", topicTitle: "Percentages", difficulty: 1, type: "numeric", prompt: "A complete question?", options: [], stimulus: null, provenance: "original-practice" }, position: 1, answer: null, skipped: false, bookmarked: false, outcome: null, key: null, explanation: null, reviewed: false }] }
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "error").mockImplementation(() => undefined); vi.mocked(getAuthContext).mockResolvedValue(ready); rpc.mockResolvedValue({ data: attempt, error: null }) })
afterEach(() => { vi.restoreAllMocks() })

describe("practice server boundary", () => {
  it("authenticates and sends no owner field while validating output", async () => {
    expect((await readPractice(attempt.id)).ok).toBe(true)
    expect(rpc).toHaveBeenCalledWith("read_practice_attempt", { p_id: attempt.id })
    expect(JSON.stringify(rpc.mock.calls[0])).not.toContain("user_id")
  })
  it("rejects forged inputs before making a persistence call", async () => {
    expect(await commandPractice({ attemptId: attempt.id, requestId: "not-a-uuid", revision: 0, operation: "save", answer: null, userId: "other" })).toMatchObject({ ok: false, code: "validation" })
    expect(rpc).not.toHaveBeenCalled()
  })
  it("does not expose database diagnostics and preserves conflicts", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "private table" } })
    const failed = await startPractice({ requestId: crypto.randomUUID(), filters: {}, questionIds: ["cat-p-017"], count: 1, mode: "practice", minutes: 10, policy: "standard" })
    expect(failed).toMatchObject({ ok: false, code: "database" }); expect(JSON.stringify(failed)).not.toContain("private table")
    rpc.mockResolvedValueOnce({ data: null, error: { code: "40001" } })
    expect(await commandPractice({ attemptId: attempt.id, requestId: crypto.randomUUID(), revision: 0, operation: "save", answer: { questionId: "cat-p-017", answer: "1", skipped: false } })).toMatchObject({ ok: false, code: "conflict" })
  })
  it("does not read private data when auth is missing or configuration is unavailable", async () => {
    vi.mocked(getAuthContext).mockResolvedValueOnce({ kind: "unauthenticated", message: "Sign in" })
    expect(await browsePractice({ filters: {}, page: 0 })).toMatchObject({ ok: false, code: "unauthenticated" }); expect(rpc).not.toHaveBeenCalled()
    vi.mocked(getAuthContext).mockResolvedValueOnce({ kind: "not_configured", message: "Setup" })
    expect(await readPractice(attempt.id)).toMatchObject({ ok: false, code: "not_configured" })
  })
  it("rejects a malformed saved snapshot rather than inventing an empty session", async () => {
    rpc.mockResolvedValueOnce({ data: { id: "bad" }, error: null })
    const result = await readPractice(attempt.id)
    expect(result).toMatchObject({ ok: false, code: "database" })
    expect(() => attemptSchema.parse({ id: "bad" })).toThrow()
  })
})
