import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { getAuthContext } from "@/lib/server/workspace"
import type { ActionResult } from "@/lib/workspace"
import { attemptCommandSchema, attemptSchema, bankFilterSchema, bankSchema, historySchema, mistakesSchema, practiceSignalSchema, startPracticeSchema } from "@/lib/practice"

type RpcResponse = { data: unknown; error: { code?: string } | null }
async function boundary<I, O>(input: unknown, inputSchema: z.ZodType<I>, outputSchema: z.ZodType<O>,
  call: (client: SupabaseClient<Database>, value: I) => PromiseLike<RpcResponse>): Promise<ActionResult<O>> {
  const auth = await getAuthContext(true)
  if (auth.kind !== "ready") return { ok: false, code: auth.kind === "error" ? "database" : auth.kind, message: auth.message }
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: "validation", message: "Check the question scope, answer format and session settings." }
  try {
    const { data, error } = await call(auth.context.supabase, parsed.data)
    if (error) {
      if (error.code === "40001") return { ok: false, code: "conflict", message: "This attempt changed in another tab or is already final. Reload saved state before continuing." }
      if (error.code === "42501") return { ok: false, code: "unauthenticated", message: "This record is unavailable for your session. Sign in again or return to your history." }
      if (["22023", "22P02", "23514", "23503", "23505", "23502"].includes(error.code ?? "")) return { ok: false, code: "validation", message: "The request was rejected. Check the scope and answer format; there may be no matching published questions." }
      console.error("Practice persistence failed", { code: error.code ?? "unknown" })
      return { ok: false, code: "database", message: "Persistence could not be confirmed. Retry the same action or reload saved state. Check development migrations if this persists." }
    }
    const result = outputSchema.safeParse(data)
    return result.success ? { ok: true, data: result.data } : { ok: false, code: "database", message: "The saved practice data is incompatible. Reload after checking the development migrations." }
  } catch {
    return { ok: false, code: "database", message: "The connection was interrupted. Your last confirmed save is retained. Retry or reload saved state." }
  }
}
const pageSchema = z.number().int().min(0).max(10000)
export function browsePractice(input: unknown) { return boundary(input, z.object({ filters: bankFilterSchema, page: pageSchema }).strict(), bankSchema, (db, v) => db.rpc("browse_practice", { p_filters: v.filters, p_page: v.page })) }
export function startPractice(input: unknown) { return boundary(input, startPracticeSchema, attemptSchema, (db, v) => db.rpc("start_practice", { p_input: v })) }
export function readPractice(input: unknown) { return boundary(input, z.string().uuid(), attemptSchema, (db, id) => db.rpc("read_practice_attempt", { p_id: id })) }
export function commandPractice(input: unknown) { return boundary(input, attemptCommandSchema, attemptSchema, (db, v) => db.rpc("command_practice", { p_input: v })) }
export function markPractice(input: unknown) { return boundary(input, z.object({ questionId: z.string().min(1).max(100), attemptId: z.string().uuid().nullable(), marked: z.boolean() }).strict(), z.boolean(), (db, v) => db.rpc("mark_practice", { p_question: v.questionId, p_attempt: v.attemptId, p_mark: v.marked })) }
export function readPracticeHistory(input: unknown) { return boundary(input, pageSchema, historySchema, (db, page) => db.rpc("practice_history", { p_page: page, p_review: false, p_unreviewed: false })) }
export function readPracticeMistakes(input: unknown) { return boundary(input, z.object({ page: pageSchema, unreviewed: z.boolean() }).strict(), mistakesSchema, (db, v) => db.rpc("practice_history", { p_page: v.page, p_review: true, p_unreviewed: v.unreviewed })) }
export function readPracticeSignals() { return boundary(null, z.null(), z.array(practiceSignalSchema), (db) => db.rpc("practice_signals")) }
