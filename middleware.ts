import { createServerClient, type SetAllCookies } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"
import { supabaseFetch } from "@/lib/supabase/fetch"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  response.headers.set("Cache-Control", "private, no-store")
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response
  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((cookies, headers) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
        response.headers.set("Cache-Control", "private, no-store")
      }) satisfies SetAllCookies,
    },
  })
  try { await supabase.auth.getUser() } catch {
    // The page independently verifies the user and renders a recoverable auth/network error.
  }
  return response
}
export const config = { matcher: ["/dashboard/:path*"] }
