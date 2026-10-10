import { createServerClient, type SetAllCookies } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"
import { supabaseFetch } from "@/lib/supabase/fetch"

export async function GET(request: NextRequest) {
  // Fixed relative destinations preserve the request host through dev/proxy normalization.
  const response = new NextResponse(null, { status: 303, headers: { Location: "/dashboard" } })
  response.headers.set("Cache-Control", "private, no-store")
  const code = request.nextUrl.searchParams.get("code")
  if (code && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: ((cookies, headers) => {
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
        }) satisfies SetAllCookies,
      },
    })
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return response
    } catch { /* Never log auth codes or tokens. */ }
  }
  // Destination is fixed. No user-supplied redirect/next URL is accepted.
  const failure = new NextResponse(null, { status: 303, headers: { Location: "/auth?link=expired" } })
  failure.headers.set("Cache-Control", "private, no-store")
  return failure
}
