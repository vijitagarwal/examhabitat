import { AuthSessionMissingError } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { enrichWorkspace, workspaceSchema, type ActionResult, type CatWorkspaceData } from "@/lib/workspace"

export async function getAuthContext(writable = false) {
  try {
    const supabase = await createSupabaseServerClient(writable)
    if (!supabase) return { kind: "not_configured" as const, message: "Configure a development Supabase project to save your workspace." }
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (error instanceof AuthSessionMissingError || ["session_not_found", "refresh_token_not_found", "bad_jwt"].includes(error.code ?? "")) {
        return { kind: "unauthenticated" as const, message: "Your session is missing or expired. Sign in to continue." }
      }
      return { kind: "error" as const, message: "Your session could not be verified. Check the connection and retry." }
    }
    if (!data.user) return { kind: "unauthenticated" as const, message: "Sign in to access your private workspace." }
    return { kind: "ready" as const, context: { supabase, user: data.user } }
  } catch {
    return { kind: "error" as const, message: "The authentication service could not be reached. Please retry." }
  }
}

export function decodeWorkspace(value: unknown): ActionResult<CatWorkspaceData> {
  const parsed = workspaceSchema.safeParse(value)
  return parsed.success ? { ok: true, data: enrichWorkspace(parsed.data) }
    : { ok: false, code: "database", message: "The saved workspace is unavailable or incompatible. Check the development migrations and reload." }
}

export async function loadCatWorkspace() {
  const auth = await getAuthContext()
  if (auth.kind !== "ready") return auth
  try {
    const { data, error } = await auth.context.supabase.rpc("read_cat_workspace")
    if (error) return { kind: "error" as const, message: "Could not read your workspace. Apply the development migrations and retry." }
    const result = decodeWorkspace(data)
    return result.ok ? { kind: "ready" as const, data: result.data } : { kind: "error" as const, message: result.message }
  } catch {
    return { kind: "error" as const, message: "The workspace connection failed. Please retry." }
  }
}
