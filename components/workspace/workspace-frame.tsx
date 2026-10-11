"use client"

import { BookOpen, CalendarDays, LogOut, Menu, Target, X, ListChecks } from "lucide-react"
import Link from "next/link"
import { useRef, useState, type ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"
import { signOut } from "@/app/auth/actions"

const links = [
  { href: "/dashboard", label: "Overview", icon: Target },
  { href: "/dashboard/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/dashboard/plan", label: "Study plan", icon: CalendarDays },
  { href: "/dashboard/practice", label: "Practice & tests", icon: ListChecks },
]

export function WorkspaceFrame({ activePath, children, signedIn = false }: { activePath: string; children: ReactNode; signedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function leave() {
    setSigningOut(true)
    try { const result = await signOut(); if (result.ok) window.location.assign("/auth"); else setError(result.message) }
    catch { setError("Sign-out could not be confirmed. Please retry.") }
    finally { setSigningOut(false) }
  }
  return <main className="min-h-screen">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to workspace content</a>
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button ref={menuButton} type="button" className="min-h-11 min-w-11 rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <BrandMark />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">CAT workspace</span>
          {signedIn ? <button type="button" onClick={leave} disabled={signingOut} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground"><LogOut className="mr-2 size-4" />{signingOut ? "Signing out…" : "Sign out"}</button> : <Link href="/auth" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-accent">Sign in</Link>}
        </div>
      </div>
    </header>
    {error && <p role="alert" className="bg-red-50 p-4 text-center text-danger">{error}</p>}
    <div id="mobile-navigation" hidden={!mobileMenuOpen} className="border-b border-line bg-surface p-5 lg:hidden" onKeyDown={(e) => { if (e.key === "Escape") { setMobileMenuOpen(false); menuButton.current?.focus() } }}><WorkspaceNav activePath={activePath} onNavigate={() => setMobileMenuOpen(false)} /></div>
    <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-[calc(100vh-73px)] border-r border-line bg-surface p-5 lg:block"><WorkspaceNav activePath={activePath} /></aside>
      <section id="workspace-content" tabIndex={-1} className="min-w-0 px-5 py-8 lg:px-10 lg:py-12">{children}</section>
    </div>
  </main>
}

function WorkspaceNav({ activePath, onNavigate }: { activePath: string; onNavigate?: () => void }) {
  return <nav aria-label="Main navigation"><p className="px-3 text-xs font-semibold uppercase tracking-[.16em] text-muted">Workspace</p><div className="mt-4 space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} aria-current={activePath === href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${activePath === href ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-surface-muted hover:text-foreground"}`}><Icon className="size-4" />{label}</Link>)}</div></nav>
}
