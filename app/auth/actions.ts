"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function signOut() {
  try {
    const supabase = await createSupabaseServerClient(true)
    if (!supabase) return { ok: false, message: "Authentication is not configured." }
    const { error } = await supabase.auth.signOut({ scope: "local" })
    return error ? { ok: false, message: "Sign-out could not be confirmed. Please retry." } : { ok: true, message: "Signed out." }
  } catch { return { ok: false, message: "Sign-out could not be confirmed. Please retry." } }
}
