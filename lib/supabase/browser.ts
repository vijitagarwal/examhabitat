import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"
import { supabaseFetch } from "@/lib/supabase/fetch"

export function createSupabaseBrowserClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { fetch: supabaseFetch } })
}
