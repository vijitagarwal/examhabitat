"use client"

import { useState } from "react"
import type { z } from "zod"
import { Button } from "@/components/button"
import { MutationMessage } from "@/components/workspace/mutation-message"
import { loadHistory, loadMistakes } from "@/app/dashboard/practice/actions"
import type { historySchema, mistakesSchema } from "@/lib/practice"

export function PracticeHistory({ initial }: { initial: z.infer<typeof historySchema> }) {
  const [data, setData] = useState(initial), [page, setPage] = useState(0), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null)
  async function load(next: number) {
    setPending(true); setError(null)
    try { const result = await loadHistory(next); if (result.ok) { setData(result.data); setPage(next) } else setError(result.message) }
    catch { setError("History could not be loaded. Retry.") } finally { setPending(false) }
  }
  return <><h1 className="page-title">Your attempt history</h1><p className="mt-3 text-muted">Resume unfinished work or inspect immutable results. An expired timed attempt is finalized when opened.</p>
    {!data.attempts.length && <p className="panel mt-6">No attempts yet. Start with a topic or a short assessment in the question bank.</p>}
    <ul className="mt-6 space-y-4">{data.attempts.map((a) => <li key={a.id} className="panel"><h2 className="font-semibold">{a.mode === "timed" ? "Timed assessment" : "Practice session"} · {a.count} questions</h2><p className="mt-2 text-sm text-muted">Started {new Date(a.startedAt).toISOString().replace("T", " ").slice(0, 19)} UTC · {a.status}</p>{a.deadline && <p className="text-sm text-muted">Deadline: {new Date(a.deadline).toISOString().replace("T", " ").slice(0, 19)} UTC</p>}{a.result && <p className="mt-2">{a.result.score}/{a.result.maxScore} points · {a.result.correct} correct · Accuracy {a.result.accuracy === null ? "unassessed" : `${a.result.accuracy}%`}</p>}<Button className="mt-4" href={`/dashboard/practice/${a.id}`}>{a.status === "active" ? "Resume / check deadline" : "Open result and explanations"}</Button></li>)}</ul>
    <MutationMessage message={error ? { error: true, text: error } : null} /><Pager page={page} total={data.total} pending={pending} load={load} />
  </>
}
export function MistakeHistory({ initial }: { initial: z.infer<typeof mistakesSchema> }) {
  const [data, setData] = useState(initial), [page, setPage] = useState(0), [unreviewed, setUnreviewed] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null)
  async function load(next: number, onlyUnreviewed = unreviewed) {
    setPending(true); setError(null)
    try { const result = await loadMistakes({ page: next, unreviewed: onlyUnreviewed }); if (result.ok) { setData(result.data); setPage(next); setUnreviewed(onlyUnreviewed) } else setError(result.message) }
    catch { setError("Mistakes could not be loaded. Retry.") } finally { setPending(false) }
  }
  return <><h1 className="page-title">Turn mistakes into revision.</h1><p className="mt-3 text-muted">Incorrect, skipped and unanswered questions from submitted attempts. Reviewing and retrying keep the original result intact.</p>
    <label className="mt-5 flex min-h-11 items-center gap-3"><input type="checkbox" disabled={pending} checked={unreviewed} onChange={(e) => void load(0, e.target.checked)} />Only unreviewed questions</label>
    {!data.mistakes.length && <p className="panel mt-4">No mistakes match this view. Completed attempts with incorrect or unanswered questions will appear here.</p>}
    <ul className="mt-4 space-y-4">{data.mistakes.map((m) => <li key={`${m.attemptId}:${m.questionId}`} className="panel"><p className="text-xs text-muted">{m.section} · {m.topicTitle} · {m.outcome} · {m.reviewed ? "Reviewed" : "Not reviewed"}</p><h2 className="mt-3 leading-7">{m.prompt}</h2><p className="mt-2 text-xs text-muted">Attempt finalized {new Date(m.finishedAt).toISOString().slice(0, 10)} UTC</p><Button className="mt-4" href={`/dashboard/practice/${m.attemptId}#${m.questionId}`}>Review explanation and retry</Button></li>)}</ul>
    <MutationMessage message={error ? { error: true, text: error } : null} /><Pager page={page} total={data.total} pending={pending} load={load} />
  </>
}
function Pager({ page, total, pending, load }: { page: number; total: number; pending: boolean; load: (page: number) => Promise<void> }) {
  return <div className="mt-6 flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={pending || page === 0} onClick={() => void load(page - 1)}>Previous page</Button><p role="status" className="text-sm">{total} records · page {page + 1}</p><Button variant="secondary" disabled={pending || (page + 1) * 12 >= total} onClick={() => void load(page + 1)}>Next page</Button></div>
}
