"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    setError(null); setMessage(null)
    const client = createSupabaseBrowserClient()
    if (!client) { setError("Authentication is not configured. Set the Supabase values in .env.local."); return }
    setLoading(true)
    try {
      const { error: authError } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (authError) setError("The sign-in link could not be sent. Check the address and try again shortly.")
      else setMessage("Check your inbox. Open the secure link in this browser to finish signing in.")
    } catch { setError("The authentication service could not be reached. Please retry.") }
    finally { setLoading(false) }
  }
  return <form onSubmit={submit} className="mt-8 space-y-5">
    <label className="field-label">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" disabled={loading} className="field-input" placeholder="you@example.com" /></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-danger">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-accent-soft p-4 text-sm text-accent-strong">{message}</p>}
    <Button type="submit" disabled={loading} className="w-full">{loading ? "Sending link…" : "Continue with email"}</Button>
  </form>
}
