"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { startSession } from "@/app/dashboard/practice/actions"
import { Button } from "@/components/button"
import { MutationMessage } from "@/components/workspace/mutation-message"
import type { BankFilter } from "@/lib/practice"

export function StartSession({ filters, questionIds = [], matching }: { filters: BankFilter; questionIds?: string[]; matching: number }) {
  const router = useRouter()
  const [mode, setMode] = useState("practice"), [count, setCount] = useState("10"), [minutes, setMinutes] = useState("20"), [policy, setPolicy] = useState("standard")
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null)
  const receipt = useRef<{ signature: string; id: string } | null>(null)
  const lock = useRef(false)
  async function begin() {
    if (lock.current) return
    lock.current = true; setPending(true); setError(null)
    const payload = { filters, questionIds, count: Number(count), minutes: Number(minutes), mode, policy }
    const signature = JSON.stringify(payload)
    if (receipt.current?.signature !== signature) receipt.current = { signature, id: crypto.randomUUID() }
    try {
      const result = await startSession({ ...payload, requestId: receipt.current.id })
      if (!result.ok) { setError(result.message); return }
      router.push(`/dashboard/practice/${result.data.id}`)
    } catch { setError("Session creation could not be confirmed. Retry with these settings or check attempt history.") }
    finally { lock.current = false; setPending(false) }
  }
  return <section className="panel mt-6"><h2 className="text-xl font-semibold">{questionIds.length ? "Retry in a new session" : "Set up your session"}</h2>
    <p className="mt-2 text-sm leading-6 text-muted">{questionIds.length || matching} matching questions. Feedback appears after submission. Original practice material, not an official CAT mock.</p>
    <form onSubmit={(e) => { e.preventDefault(); void begin() }}>
      <fieldset disabled={pending} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><legend className="sr-only">Session settings</legend>
        <label className="field-label">Mode<select className="field-input" value={mode} onChange={(e) => setMode(e.target.value)}><option value="practice">Untimed practice</option><option value="timed">Timed assessment</option></select></label>
        {!questionIds.length && <label className="field-label">Question limit<input className="field-input" type="number" min={1} max={20} required value={count} onChange={(e) => setCount(e.target.value)} /></label>}
        <label className="field-label">Time limit (timed only)<input className="field-input" type="number" min={1} max={120} required disabled={mode !== "timed"} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label className="field-label">Practice scoring<select className="field-input" value={policy} onChange={(e) => setPolicy(e.target.value)}><option value="standard">+3 correct; −1 wrong MCQ</option><option value="no-negative">+3 correct; no penalties</option></select></label>
      </fieldset>
      <p className="mt-4 text-xs leading-6 text-muted">Numeric, skipped and unanswered questions have no penalty. Stable catalog ordering; if fewer questions match, all available matches are used. Linked questions may form a subset of a passage or set; shared material is always included. A timed deadline starts when you press Start.</p>
      <Button className="mt-4" type="submit" disabled={pending || (!matching && !questionIds.length)}>{pending ? "Starting…" : "Start session"}</Button>
    </form><MutationMessage message={error ? { error: true, text: error } : null} />
  </section>
}
