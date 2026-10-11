import { z } from "zod"
import { ANALYTICS_WINDOW_DAYS, createPerformanceAnalytics, rawAnalyticsSchema, type PerformanceAnalytics } from "@/lib/analytics"
import { decodeWorkspace, getAuthContext } from "@/lib/server/workspace"
import type { ActionResult } from "@/lib/workspace"

export async function readPerformanceAnalytics(days = ANALYTICS_WINDOW_DAYS): Promise<ActionResult<PerformanceAnalytics>> {
  const auth = await getAuthContext()
  if (auth.kind !== "ready") return { ok: false, code: auth.kind === "error" ? "database" : auth.kind, message: auth.message }
  const validDays = z.number().int().min(7).max(3650).safeParse(days)
  if (!validDays.success) return { ok: false, code: "validation", message: "Choose an analytics window between 7 and 3650 days." }
  try {
    const [analyticsResponse, workspaceResponse] = await Promise.all([
      auth.context.supabase.rpc("read_practice_analytics", { p_days: validDays.data }),
      auth.context.supabase.rpc("read_cat_workspace"),
    ])
    if (analyticsResponse.error || workspaceResponse.error) return { ok: false, code: "database", message: "Performance data could not be loaded. Apply all development migrations and retry." }
    const parsed = rawAnalyticsSchema.safeParse(analyticsResponse.data)
    const workspace = decodeWorkspace(workspaceResponse.data)
    if (!parsed.success || !workspace.ok) return { ok: false, code: "database", message: "The saved performance data is unavailable or incompatible. Reload after checking the development migrations." }
    return { ok: true, data: createPerformanceAnalytics(parsed.data, workspace.data.catalog.topics, workspace.data.catalog.sections) }
  } catch {
    return { ok: false, code: "database", message: "The performance connection failed. Retry or reload your workspace." }
  }
}
