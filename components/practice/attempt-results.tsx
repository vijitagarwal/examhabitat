"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { MutationMessage } from "@/components/workspace/mutation-message"
import { bankFilterSchema, type PracticeAttempt } from "@/lib/practice"
import { markQuestion } from "@/app/dashboard/practice/actions"
import { QuestionContent } from "./practice-shared"
import { StartSession } from "./start-session"

export function AttemptResults({ attempt }: { attempt: PracticeAttempt }) {
  const [items, setItems] = useState(attempt.items), [filter, setFilter] = useState("all")
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null)
  const result = attempt.result
  if (!result) return <p role="alert">The result has not been confirmed. Reload this attempt.</p>
  async function mark(questionId: string, review: boolean, marked: boolean) {
    if (pending) return
    setPending(true); setError(null)
    try {
      const saved = await markQuestion({ questionId, attemptId: review ? attempt.id : null, marked })
      if (saved.ok) setItems((old) => old.map((i) => i.question.id === questionId ? { ...i, ...(review ? { reviewed: saved.data } : { bookmarked: saved.data }) } : i))
      else setError(saved.message)
    } catch { setError("Review state could not be saved. Retry.") }
    finally { setPending(false) }
  }
  const visible = items.filter((i) => filter === "all" || (filter === "bookmarked" ? i.bookmarked : filter === "unanswered" ? ["unanswered", "skipped"].includes(i.outcome ?? "") : i.outcome === filter))
  const mistakes = items.filter((i) => i.outcome !== "correct").map((i) => i.question.id)
  const display = (item: typeof items[number], answer: string | null) => answer ? `${answer}${item.question.options.find((o) => o.id === answer) ? ` · ${item.question.options.find((o) => o.id === answer)?.text}` : ""}` : "No answer"
  return <>
    <p className="eyebrow">{attempt.status === "expired" ? "Time expired · saved answers scored" : "Submission confirmed"}</p><h1 className="page-title">Your practice result</h1>
    <section className="panel mt-6" aria-label="Result summary"><p className="text-3xl font-semibold">{result.score} / {result.maxScore} points</p>
      <p className="mt-3">{result.correct} correct · {result.incorrect} incorrect · {result.unanswered} unanswered (including {result.skipped} skipped)</p>
      <p className="mt-2">Accuracy: {result.accuracy === null ? "Not assessed" : `${result.accuracy}%`} · {result.attempted} answered / {result.total} questions</p>
      <p className="mt-2 text-sm text-muted">Accuracy uses answered questions only. Elapsed wall-clock time: {Math.floor(result.elapsedSeconds / 60)}m {result.elapsedSeconds % 60}s; includes time away, not per-question study time.</p>
      <p className="mt-2 text-sm text-muted">{attempt.policy.version}: +3 correct, −{attempt.policy.mcqPenalty} wrong MCQ, no numeric or unanswered penalty. Manual topic status and mastery are unchanged.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">{result.sections.map((s) => <li key={s.section} className="rounded-xl bg-surface-muted p-4"><h2 className="font-semibold">{s.section}</h2><p>{s.score}/{s.maxScore} points · {s.correct}/{s.attempted} correct among answered</p><p className="text-sm">{s.unanswered} unanswered</p></li>)}</ul>
      <div className="mt-4 flex flex-wrap gap-3"><Button href="/dashboard/plan">Plan your next revision</Button><Button href="/dashboard/syllabus" variant="secondary">Update topic progress</Button><Button href="/dashboard/practice/mistakes" variant="secondary">All mistakes</Button></div>
    </section>
    <section className="mt-6" aria-label="Answer review"><h2 className="text-2xl font-semibold">Review answers</h2>
      <label className="field-label mt-4 max-w-sm">Review filter<select className="field-input" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All questions</option><option value="incorrect">Incorrect</option><option value="unanswered">Unanswered and skipped</option><option value="correct">Correct</option><option value="bookmarked">Bookmarked</option></select></label>
      <MutationMessage message={error ? { error: true, text: error } : null} />
      {!visible.length && <p role="status" className="panel mt-4">No questions match this review filter.</p>}
      {visible.map((item) => <article id={item.question.id} key={item.question.id} className="panel mt-4 scroll-mt-4">
        <h3 className="mb-4 font-semibold">Question {item.position} · {item.outcome} {item.reviewed ? "· Reviewed" : ""}</h3><QuestionContent question={item.question} />
        <dl className="mt-5 space-y-3"><div><dt className="text-sm text-muted">Your answer</dt><dd>{item.skipped ? "Skipped" : display(item, item.answer)}</dd></div><div><dt className="text-sm text-muted">Correct answer</dt><dd className="font-semibold">{display(item, item.key)}</dd></div><div><dt className="text-sm text-muted">Explanation</dt><dd className="mt-1 whitespace-pre-wrap leading-7">{item.explanation}</dd></div></dl>
        <div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" disabled={pending} onClick={() => void mark(item.question.id, false, !item.bookmarked)}>{item.bookmarked ? "Remove bookmark" : "Bookmark question"}</Button>
          {item.outcome !== "correct" && <Button variant="secondary" disabled={pending} onClick={() => void mark(item.question.id, true, !item.reviewed)}>{item.reviewed ? "Mark unreviewed" : "Mark reviewed"}</Button>}
          <Button variant="ghost" href={`/dashboard/practice?topicId=${encodeURIComponent(item.question.topicId)}`}>Practise this topic</Button></div>
      </article>)}
    </section>
    {mistakes.length > 0 && <StartSession filters={bankFilterSchema.parse({})} questionIds={mistakes} matching={mistakes.length} />}
  </>
}
