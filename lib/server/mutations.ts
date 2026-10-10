import { z } from "zod"
import { generateStudyQueue } from "@/lib/planner"
import { studyPreferencesSchema, topicProgressInputSchema } from "@/lib/progress"
import { mutationEnvelopeSchema, type ActionResult, type CatWorkspaceData } from "@/lib/workspace"
import { decodeWorkspace, getAuthContext } from "@/lib/server/workspace"
import type { Json } from "@/lib/supabase/database.types"
import { formatDateInTimeZone } from "@/lib/dates"

const schemas = {
  progress: mutationEnvelopeSchema.extend({ payload: topicProgressInputSchema }).strict(),
  preferences: mutationEnvelopeSchema.extend({ payload: z.object({ preferences: studyPreferencesSchema }).strict() }).strict(),
  plan: mutationEnvelopeSchema.extend({ payload: z.object({ preferences: studyPreferencesSchema }).strict() }).strict(),
  task: mutationEnvelopeSchema.extend({ payload: z.object({ taskId: z.string().uuid(), status: z.enum(["in_progress", "completed", "skipped"]) }).strict() }).strict(),
}
export type MutationOperation = keyof typeof schemas

export async function executeWorkspaceMutation(operation: MutationOperation, input: unknown): Promise<ActionResult<CatWorkspaceData>> {
  const auth = await getAuthContext(true)
  if (auth.kind !== "ready") return { ok: false, code: auth.kind === "error" ? "database" : auth.kind, message: auth.message }
  const parsed = schemas[operation].safeParse(input)
  if (!parsed.success) return { ok: false, code: "validation", message: parsed.error.issues[0]?.message ?? "Review the values and retry." }
  const { supabase } = auth.context
  const { requestId, expectedRevision } = parsed.data
  let payload: Json = parsed.data.payload
  try {
    if (operation === "plan" && "preferences" in parsed.data.payload) {
      const loaded = await supabase.rpc("read_cat_workspace")
      if (loaded.error) return { ok: false, code: "database", message: "Could not read the current plan. Please retry." }
      const result = decodeWorkspace(loaded.data)
      if (!result.ok) return result
      const { preferences } = parsed.data.payload
      const today = formatDateInTimeZone(new Date(), preferences.timezone)
      if (expectedRevision !== result.data.revision) return { ok: false, code: "conflict", message: "Your workspace changed in another tab. Reload before generating." }
      const existingTasks = result.data.plans.find((plan) => plan.planDate === today)?.tasks ?? []
      let queue
      try {
        queue = generateStudyQueue({ topics: result.data.catalog.topics, progressByTopic: new Map(result.data.progress.map((p) => [p.topicId, p])),
          preferences, referenceDate: today, existingTasks })
      } catch (error) {
        return { ok: false, code: "validation", message: error instanceof Error && error.message.startsWith("The budget") ? error.message : "The syllabus cannot be scheduled with these settings. Check the catalog and retry." }
      }
      payload = { preferences, planDate: today, algorithmVersion: queue.algorithmVersion, tasks: queue.tasks }
    }
    const { data, error } = await supabase.rpc("mutate_cat_workspace", {
      p_request_id: requestId, p_expected_revision: expectedRevision, p_operation: operation, p_payload: payload,
    })
    if (error) {
      if (error.code === "40001") return { ok: false, code: "conflict", message: "Saved data changed in another tab or the planning day changed. Reload before saving." }
      if (error.code === "42501") return { ok: false, code: "unauthenticated", message: "This action is unavailable for your session. Sign in and reload." }
      if (["22023", "23514", "23502", "23505", "23503"].includes(error.code)) return { ok: false, code: "validation", message: "The database rejected these values or this state change. Reload and review your input." }
      return { ok: false, code: "database", message: "The save could not be confirmed. Retry the same submission or reload to check the saved state." }
    }
    return decodeWorkspace(data)
  } catch {
    return { ok: false, code: "database", message: "The connection was interrupted. Retry the same submission or reload to check the saved state." }
  }
}
