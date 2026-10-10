"use client"

import { AlertTriangle, CloudOff, LockKeyhole, RefreshCw } from "lucide-react"
import { Button } from "@/components/button"

export function WorkspaceState({ kind, message }: { kind: "not_configured" | "unauthenticated" | "error"; message: string }) {
  const states = {
    not_configured: { icon: CloudOff, eyebrow: "Local setup needed", title: "Connect your saved workspace",
      detail: "The CAT taxonomy is ready, but cloud-backed progress needs valid Supabase values in .env.local. No local-storage substitute is used." },
    unauthenticated: { icon: LockKeyhole, eyebrow: "Sign-in required", title: "Enter your private workspace",
      detail: "Your topic progress and study plans belong to your account. Sign in to continue." },
    error: { icon: AlertTriangle, eyebrow: "Workspace unavailable", title: "We could not load your CAT data", detail: message },
  }
  const state = states[kind]
  const Icon = state.icon
  return <div className="grid min-h-[60vh] place-items-center">
    <div className="max-w-lg text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="size-7" /></span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">{state.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{state.title}</h1>
      <p className="mt-4 leading-7 text-muted">{state.detail}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {kind === "error" && <Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 size-4" />Try again</Button>}
        {kind === "unauthenticated" && <Button href="/auth">Continue</Button>}
        <Button href="/" variant="secondary">Back home</Button>
      </div>
    </div>
  </div>
}
