// @vitest-environment node
import { AuthApiError, AuthSessionMissingError, createClient, type User } from "@supabase/supabase-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthContext, loadCatWorkspace } from "@/lib/server/workspace"
import { executeWorkspaceMutation } from "@/lib/server/mutations"
import type { Database } from "@/lib/supabase/database.types"
import { workspaceFixture } from "./fixtures"
import { DEFAULT_STUDY_PREFERENCES } from "@/lib/progress"

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }))
const transport = vi.fn<typeof fetch>()
const user: User = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" }
const envelope = { requestId: "00000000-0000-4000-8000-000000000003", expectedRevision: 0 }
const progress = { topicId: "cat-varc-rc-main-idea", status: "learning", confidence: 2, priority: 3, minutesStudied: 20 }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
let client: ReturnType<typeof createClient<Database>>

beforeEach(() => {
  vi.resetAllMocks()
  client = createClient<Database>("http://127.0.0.1:54321", "public-local-test-placeholder", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: transport } })
  vi.mocked(createSupabaseServerClient).mockResolvedValue(client)
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null })
})
afterEach(() => { vi.restoreAllMocks() })

describe("server session/data boundary", () => {
  it("shows setup rather than a demo/auth bypass when config is missing", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null)
    expect((await loadCatWorkspace()).kind).toBe("not_configured")
    expect(transport).not.toHaveBeenCalled()
  })
  it("does not read or mutate private data for a missing session", async () => {
    vi.mocked(client.auth.getUser).mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() })
    expect((await loadCatWorkspace()).kind).toBe("unauthenticated")
    expect(await executeWorkspaceMutation("progress", { ...envelope, payload: progress })).toMatchObject({ ok: false, code: "unauthenticated" })
    expect(transport).not.toHaveBeenCalled()
  })
  it("distinguishes a network/service error from an absent session", async () => {
    vi.mocked(client.auth.getUser).mockResolvedValue({ data: { user: null }, error: new AuthApiError("internal host information", 503, "unexpected_failure") })
    expect(await getAuthContext()).toMatchObject({ kind: "error" })
    expect(JSON.stringify(await getAuthContext())).not.toContain("internal host")
  })
  it("reads and validates a single consistent workspace snapshot", async () => {
    transport.mockResolvedValue(response(workspaceFixture()))
    expect((await loadCatWorkspace()).kind).toBe("ready")
    expect(transport).toHaveBeenCalledTimes(1)
  })
  it("does not mask a database or malformed snapshot as an empty account", async () => {
    transport.mockResolvedValue(response({ catalog: null }))
    expect((await loadCatWorkspace()).kind).toBe("error")
  })
})

describe("validated server mutations with isolated HTTP transport", () => {
  it("sends an authenticated progress command without any client-supplied owner", async () => {
    transport.mockResolvedValue(response(workspaceFixture({ revision: 1 })))
    const result = await executeWorkspaceMutation("progress", { ...envelope, payload: progress })
    expect(result).toMatchObject({ ok: true, data: { revision: 1 } })
    const [, init] = transport.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ p_request_id: envelope.requestId, p_expected_revision: 0, p_operation: "progress", p_payload: progress })
  })
  it("rejects forged ownership fields and invalid numeric values before persistence", async () => {
    expect(await executeWorkspaceMutation("progress", { ...envelope, payload: { ...progress, userId: "someone-else" } })).toMatchObject({ ok: false, code: "validation" })
    expect(await executeWorkspaceMutation("progress", { ...envelope, payload: { ...progress, confidence: 6 } })).toMatchObject({ ok: false, code: "validation" })
    expect(transport).not.toHaveBeenCalled()
  })
  it.each(["progress", "plan", "task"] as const)("preserves a failure for %s without exposing raw database diagnostics", async (operation) => {
    const payload = operation === "progress" ? progress : operation === "task" ? { taskId: envelope.requestId, status: "completed" } : { preferences: DEFAULT_STUDY_PREFERENCES }
    if (operation === "plan") transport.mockResolvedValueOnce(response(workspaceFixture()))
    transport.mockResolvedValue(response({ code: "XX000", message: "private SQL details", details: "private table" }, 500))
    const result = await executeWorkspaceMutation(operation, { ...envelope, payload })
    expect(result).toMatchObject({ ok: false, code: "database" })
    expect(JSON.stringify(result)).not.toContain("private SQL")
  })
  it("returns a recoverable conflict on stale writes", async () => {
    transport.mockResolvedValue(response({ code: "40001", message: "stale" }, 409))
    expect(await executeWorkspaceMutation("progress", { ...envelope, payload: progress })).toMatchObject({ ok: false, code: "conflict" })
  })
  it("generates a bounded real queue then saves the entire plan in one RPC", async () => {
    transport.mockResolvedValueOnce(response(workspaceFixture()))
    transport.mockResolvedValueOnce(response(workspaceFixture({ revision: 1 })))
    const result = await executeWorkspaceMutation("plan", { ...envelope, payload: { preferences: DEFAULT_STUDY_PREFERENCES } })
    expect(result.ok).toBe(true)
    expect(transport).toHaveBeenCalledTimes(2)
    const body = JSON.parse(String(transport.mock.calls[1][1]?.body))
    expect(body.p_payload.tasks.length).toBeGreaterThan(0)
    expect(body.p_payload.tasks.reduce((sum: number, task: { plannedMinutes: number }) => sum + task.plannedMinutes, 0)).toBeLessThanOrEqual(60)
  })
  it("does not write when completion raced plan calculation", async () => {
    transport.mockResolvedValueOnce(response(workspaceFixture({ revision: 1 })))
    expect(await executeWorkspaceMutation("plan", { ...envelope, payload: { preferences: DEFAULT_STUDY_PREFERENCES } })).toMatchObject({ ok: false, code: "conflict" })
    expect(transport).toHaveBeenCalledTimes(1)
  })
})
