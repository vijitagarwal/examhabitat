"use client"

import { useRef, useState, type FormEvent } from "react"
import type { z } from "zod"
import { bankFilterSchema, type BankFilter, type bankSchema } from "@/lib/practice"
import { browseQuestions, markQuestion } from "@/app/dashboard/practice/actions"
import { Button } from "@/components/button"
import { MutationMessage } from "@/components/workspace/mutation-message"
import { StartSession } from "./start-session"

export function QuestionBank({ initial, initialFilters, topics }: { initial: z.infer<typeof bankSchema>; initialFilters: BankFilter; topics: { id: string; title: string; section: string }[] }) {
  const [data, setData] = useState(initial), [filters, setFilters] = useState(initialFilters), [page, setPage] = useState(0)
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const lock = useRef(false)
  async function load(next: BankFilter, nextPage = 0) {
    if (lock.current) return
    lock.current = true; setPending(true); setError(null)
    try { const result = await browseQuestions({ filters: next, page: nextPage }); if (result.ok) { setData(result.data); setFilters(next); setPage(nextPage); setSelected([]) } else setError(result.message) }
    catch { setError("Question discovery failed. Retry your filters.") }
    finally { lock.current = false; setPending(false) }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = bankFilterSchema.safeParse({ ...fields, difficulty: Number(fields.difficulty) })
    if (parsed.success) void load(parsed.data); else setError("Check the selected filters.")
  }
  async function bookmark(id: string, marked: boolean) {
    if (lock.current) return
    lock.current = true; setPending(true); setError(null)
    try { const result = await markQuestion({ questionId: id, attemptId: null, marked }); if (result.ok) setData((old) => ({ ...old, questions: old.questions.map((q) => q.question.id === id ? { ...q, bookmarked: result.data } : q) })); else setError(result.message) }
    catch { setError("Bookmark save failed. Retry.") }
    finally { lock.current = false; setPending(false) }
  }
  return <>
    <h1 className="page-title">Practise with a purpose.</h1><p className="mt-3 text-muted">Browse original questions, choose a topic, or build a mixed timed assessment.</p>
    <form key={JSON.stringify(filters)} onSubmit={filter} className="panel mt-6"><fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><legend className="sr-only">Question filters</legend>
      <label className="field-label">Search question text<input name="search" type="search" maxLength={100} defaultValue={filters.search} className="field-input" /></label>
      <label className="field-label">Section<select name="section" defaultValue={filters.section} className="field-input"><option value="">All sections</option>{["VARC", "DILR", "QA"].map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="field-label">Topic<select name="topicId" defaultValue={filters.topicId} className="field-input"><option value="">All topics</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.section} · {t.title}</option>)}</select></label>
      <label className="field-label">Difficulty<select name="difficulty" defaultValue={filters.difficulty} className="field-input"><option value={0}>Any difficulty</option>{[1, 2, 3].map((n) => <option key={n} value={n}>{n} / 3</option>)}</select></label>
      <label className="field-label">Answer type<select name="type" defaultValue={filters.type} className="field-input"><option value="">All types</option><option value="mcq">Single-correct MCQ</option><option value="numeric">Numeric / TITA</option></select></label>
      <label className="field-label">Question history<select name="history" defaultValue={filters.history} className="field-input"><option value="all">All questions</option><option value="attempted">In a finalized attempt</option><option value="unattempted">Never in a finalized attempt</option><option value="bookmarked">Bookmarked</option></select></label>
    </fieldset><div className="mt-4 flex flex-wrap gap-3"><Button disabled={pending} type="submit">Apply filters</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => void load(bankFilterSchema.parse({}))}>Clear filters</Button></div></form>
    <MutationMessage message={error ? { error: true, text: error } : null} />
    <p role="status" className="mt-6 text-sm text-muted">{pending ? "Loading…" : `${data.total} matching questions · page ${page + 1}. Setup uses the applied filters below.`}</p>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">{data.questions.map(({ question: q, attempted, bookmarked }) => <article key={q.id} className="panel">
      <p className="text-xs text-muted">{q.section} · {q.topicTitle} · Difficulty {q.difficulty}/3 · {q.type === "mcq" ? "MCQ" : "Numeric"} · {attempted ? "Previously included" : "New"}</p>
      {q.stimulus && <p className="mt-2 text-sm font-semibold text-accent">Shared {q.stimulus.kind}: {q.stimulus.title}</p>}
      <h2 className="mt-3 leading-7">{q.prompt}</h2><div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(q.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, q.id] : ids.filter((id) => id !== q.id))} />Select {q.id}</label>
        <Button variant="ghost" disabled={pending} onClick={() => void bookmark(q.id, !bookmarked)}>{bookmarked ? "Remove bookmark" : "Bookmark"}</Button>
      </div>
    </article>)}</div>
    {!data.questions.length && <p className="panel mt-4">No matching questions. Clear filters or choose another topic. Some syllabus topics do not yet have practice content.</p>}
    <div className="mt-4 flex gap-3"><Button variant="secondary" disabled={pending || page === 0} onClick={() => void load(filters, page - 1)}>Previous page</Button><Button variant="secondary" disabled={pending || (page + 1) * 12 >= data.total} onClick={() => void load(filters, page + 1)}>Next page</Button></div>
    <p className="mt-4 text-sm text-muted">{selected.length ? `${selected.length} selected on this page; the session will use exactly these questions.` : "No explicit selection: the session will use the applied filters across all pages."}</p>
    <StartSession filters={filters} questionIds={selected} matching={data.total} />
  </>
}
