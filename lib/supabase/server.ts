import { createServerClient, type SetAllCookies } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

export async function createSupabaseServerClient(writable = false) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  const cookieStore = await cookies()
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll: ((cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          // Server Components cannot set cookies; middleware refreshes them before rendering.
          // Actions must propagate write failures instead of claiming authentication succeeded.
          if (writable) throw error
        }
      }) satisfies SetAllCookies,
    },
  })
}
