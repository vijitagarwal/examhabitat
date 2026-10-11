"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/button"
import { MutationMessage } from "@/components/workspace/mutation-message"
import { markQuestion, refreshSession, saveSession } from "@/app/dashboard/practice/actions"
import { normalizeNumeric, type PracticeAttempt } from "@/lib/practice"
import { QuestionContent } from "./practice-shared"
import { AttemptResults } from "./attempt-results"
import { SessionTimer } from "./session-timer"

export function ActiveSession({ initial }: { initial: PracticeAttempt }) {
  const [attempt, setAttempt] = useState(initial), [index, setIndex] = useState(0)
  const [draft, setDraft] = useState({ answer: initial.items[0].answer ?? "", skipped: initial.items[0].skipped })
  const [pending, setPending] = useState(false), [confirm, setConfirm] = useState(false), [expired, setExpired] = useState(false)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
  const lock = useRef(false), receipt = useRef<{ signature: string; id: string } | null>(null)
  const item = attempt.items[index]
  const dirty = draft.answer.trim() !== (item.answer ?? "") || draft.skipped !== item.skipped
  const active = attempt.status === "active"
  const draftValid = !draft.answer.trim() || item.question.type === "mcq" || normalizeNumeric(draft.answer) !== null

  const persist = useCallback(async (operation: "save" | "submit") => {
    if (lock.current) return null
    if (!draftValid) { setMessage({ error: true, text: "Enter a decimal such as 0.5, with at most six fractional digits; fractions and exponents are not accepted." }); return null }
    lock.current = true; setPending(true); setMessage(null)
    const payload = { attemptId: attempt.id, revision: attempt.revision, operation,
      answer: { questionId: item.question.id, answer: draft.answer.trim() || null, skipped: draft.skipped } }
    const signature = JSON.stringify(payload)
    if (receipt.current?.signature !== signature) receipt.current = { signature, id: crypto.randomUUID() }
    try {
      const result = await saveSession({ ...payload, requestId: receipt.current.id })
      if (!result.ok) { setMessage({ error: true, text: result.message }); return null }
      setAttempt(result.data); receipt.current = null
      const saved = result.data.items[index]
      setDraft({ answer: saved.answer ?? "", skipped: saved.skipped })
      setMessage({ error: false, text: result.data.status === "expired" ? "Time expired. Only previously saved answers were scored." : "Answer saved to your account." })
      return result.data
    } catch { setMessage({ error: true, text: "Save not confirmed. Your draft is still here. Retry the same action before leaving." }); return null }
    finally { lock.current = false; setPending(false) }
  }, [attempt.id, attempt.revision, draft, draftValid, index, item.question.id])

  // Incremental autosave. A failed save stops automatic retries; the student retains control.
  useEffect(() => {
    if (!active || !dirty || pending || !draftValid || message?.error || expired) return
    const timer = setTimeout(() => void persist("save"), 800)
    return () => clearTimeout(timer)
  }, [active, dirty, pending, draftValid, message?.error, expired, persist])

  // Save before in-app link navigation, and use a native warning only as a last resort on tab close.
  useEffect(() => {
    if (!active || (!dirty && !pending)) return
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    const navigate = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null
      if (!target || event.ctrlKey || event.metaKey || event.shiftKey || target.hash || target.target === "_blank") return
      event.preventDefault(); event.stopPropagation()
      if (!lock.current) void persist("save").then((saved) => { if (saved) window.location.assign(target.href) })
    }
    window.addEventListener("beforeunload", unload); document.addEventListener("click", navigate, true)
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true) }
  }, [active, dirty, pending, persist])

  async function move(next: number) {
    if (lock.current || next < 0 || next >= attempt.items.length) return
    const saved = dirty ? await persist("save") : attempt
    if (!saved || saved.status !== "active") return
    setIndex(next); setDraft({ answer: saved.items[next].answer ?? "", skipped: saved.items[next].skipped }); setMessage(null); setConfirm(false)
  }
  const refresh = useCallback(async () => {
    if (lock.current) return
    lock.current = true; setPending(true)
    try {
      const result = await refreshSession(attempt.id)
      if (!result.ok) { setMessage({ error: true, text: result.message }); return }
      setAttempt(result.data); setDraft({ answer: result.data.items[index].answer ?? "", skipped: result.data.items[index].skipped })
      setMessage({ error: false, text: "Saved state reloaded." })
    } catch { setMessage({ error: true, text: "Could not confirm the result. Retry loading saved state." }) }
    finally { lock.current = false; setPending(false) }
  }, [attempt.id, index])
  async function bookmark() {
    if (lock.current) return
    lock.current = true; setPending(true)
    try {
      const result = await markQuestion({ questionId: item.question.id, attemptId: null, marked: !item.bookmarked })
      if (result.ok) setAttempt((old) => ({ ...old, items: old.items.map((i) => i.question.id === item.question.id ? { ...i, bookmarked: result.data } : i) }))
      else setMessage({ error: true, text: result.message })
    } catch { setMessage({ error: true, text: "Bookmark failed. Retry." }) }
    finally { lock.current = false; setPending(false) }
  }
  // If a save was in flight when time elapsed, refresh as soon as it settles.
  const expiryChecked = useRef(false)
  useEffect(() => {
    if (expired && !pending && active && !expiryChecked.current) { expiryChecked.current = true; void refresh() }
  }, [expired, pending, active, refresh])
  if (!active) return <AttemptResults key={attempt.id} attempt={attempt} />
  const answered = attempt.items.filter((i) => i.answer !== null).length
  return <>
    <div className="flex flex-wrap justify-between gap-4"><div><p className="eyebrow">{attempt.mode === "timed" ? "Timed assessment" : "Untimed practice"}</p><h1 className="page-title">Question {index + 1} of {attempt.items.length}</h1><p className="mt-2 text-sm text-muted">{answered} saved answers · +3 correct, −{attempt.policy.mcqPenalty} wrong MCQ · feedback after submission</p></div>
      {attempt.deadline && <SessionTimer deadline={attempt.deadline} serverNow={attempt.serverNow} onExpire={() => setExpired(true)} />}</div>
    <nav aria-label="Question navigation" className="my-6 flex flex-wrap gap-2">{attempt.items.map((q, n) => <button key={q.question.id} disabled={pending || expired} aria-current={n === index ? "step" : undefined} aria-label={`Question ${n + 1}, ${q.skipped ? "skipped" : q.answer !== null ? "answered" : "unanswered"}${q.bookmarked ? ", bookmarked" : ""}`} className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm ${n === index ? "border-accent bg-accent-soft" : "border-line bg-surface"}`} onClick={() => void move(n)}>{n + 1} {q.skipped ? "–" : q.answer !== null ? "✓" : "○"}{q.bookmarked ? " ★" : ""}</button>)}</nav>
    <article className="panel"><QuestionContent question={item.question} />
      <fieldset disabled={pending || expired} className="mt-6 space-y-3"><legend className="mb-3 font-semibold">Your answer</legend>
        {item.question.type === "mcq" ? item.question.options.map((option) => <label key={option.id} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.answer === option.id ? "border-accent bg-accent-soft" : "border-line"}`}><input className="mt-1" type="radio" name="answer" value={option.id} checked={draft.answer === option.id} onChange={() => { setDraft({ answer: option.id, skipped: false }); setMessage(null) }} /><span>{option.id}. {option.text}</span></label>) : <label className="field-label">Numeric answer<input aria-label="Numeric answer" className="field-input max-w-md" inputMode="decimal" type="text" maxLength={32} autoComplete="off" value={draft.answer} onChange={(e) => { setDraft({ answer: e.target.value, skipped: false }); setMessage(null) }} aria-describedby="numeric-help" /><span id="numeric-help" className="mt-2 block text-xs text-muted">Exact decimal, e.g. 0.5 or -12. Up to 6 decimal places; no fractions, commas or exponents.</span></label>}
        <div className="flex flex-wrap gap-3"><Button variant="ghost" onClick={() => { setDraft({ answer: "", skipped: false }); setMessage(null) }}>Clear answer</Button><Button variant="secondary" onClick={() => { setDraft({ answer: "", skipped: true }); setMessage(null) }}>Skip question</Button></div>
      </fieldset>
      <p role="status" className="mt-4 text-sm">{pending ? "Saving or checking…" : dirty ? "Unsaved draft — autosaves after a short pause." : draft.skipped ? "Skip saved." : "Saved state loaded."}</p>
      <MutationMessage message={message} />
      <div className="mt-5 flex flex-wrap gap-3"><Button disabled={pending || expired} onClick={() => void persist("save")}>Save answer</Button><Button variant="secondary" disabled={pending} onClick={() => void bookmark()}>{item.bookmarked ? "Remove bookmark" : "Bookmark for review"}</Button><Button variant="ghost" disabled={pending} onClick={() => void refresh()}>Reload saved state (discard draft)</Button></div>
    </article>
    <div className="mt-5 flex flex-wrap justify-between gap-3"><Button variant="secondary" disabled={pending || expired || index === 0} onClick={() => void move(index - 1)}>Previous question</Button><Button variant="secondary" disabled={pending || expired || index === attempt.items.length - 1} onClick={() => void move(index + 1)}>Next question</Button><Button disabled={pending} onClick={() => setConfirm(true)}>Submit attempt</Button></div>
    {expired && <p role="alert" className="panel mt-5">The timer has ended. Editing is locked. If the result has not loaded, use Reload saved state; only answers saved before the server deadline count.</p>}
    {confirm && <section className="panel mt-5" aria-label="Confirm submission"><h2 className="text-xl font-semibold">Finish this attempt?</h2><p className="mt-2">Submission locks all answers and reveals solutions. Unanswered questions score zero. Your current valid draft is included only if the server deadline has not passed.</p><div className="mt-4 flex gap-3"><Button disabled={pending} onClick={() => expired ? void refresh() : void persist("submit")}>Confirm submission</Button><Button variant="secondary" onClick={() => setConfirm(false)}>Keep practising</Button></div></section>}
  </>
}
