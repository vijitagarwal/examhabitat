"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/button"
import { isDateDue } from "@/lib/dates"
import { emptyTopicProgress, statusLabels, topicStatusSchema } from "@/lib/progress"
import { TopicEditor } from "./topic-editor"
import type { CatWorkspaceData } from "@/lib/workspace"

export function SyllabusExplorer({ data, onSaved }: { data: CatWorkspaceData; onSaved: (data: CatWorkspaceData) => void }) {
  const [search, setSearch] = useState("")
  const [sectionId, setSectionId] = useState("all")
  const [filter, setFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const progressMap = useMemo(() => new Map(data.progress.map((p) => [p.topicId, p])), [data.progress])
  const filtered = data.catalog.topics.filter((topic) => {
    const progress = progressMap.get(topic.id) ?? emptyTopicProgress(topic.id, topic.defaultPriority)
    return `${topic.title} ${topic.description}`.toLowerCase().includes(search.trim().toLowerCase())
      && (sectionId === "all" || topic.sectionId === sectionId)
      && (filter === "all" || filter === progress.status || (filter === "weak" && progress.status !== "not_started" && progress.confidence <= 2) || (filter === "due" && isDateDue(progress.reviewDueOn, data.today)))
  })
  const selected = data.catalog.topics.find((topic) => topic.id === selectedId)
  return <>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">CAT syllabus · {data.catalog.version}</p><h1 className="page-title">Know what to work on.</h1><p className="mt-3 text-muted">{data.catalog.topics.length} topics across VARC, DILR and QA. Save progress that reflects your learning.</p></div><Button href="/dashboard/plan">Open study plan</Button></div>
    <section aria-label="Syllabus filters" className="panel mt-8 grid gap-4 sm:grid-cols-3">
      <label className="field-label">Search topics<input value={search} onChange={(e) => setSearch(e.target.value)} className="field-input" type="search" placeholder="Topic or concept" /></label>
      <label className="field-label">Section<select className="field-input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}><option value="all">All sections</option>{data.catalog.sections.map((section) => <option key={section.id} value={section.id}>{section.code}</option>)}</select></label>
      <label className="field-label">Learning state<select className="field-input" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Any state</option>{topicStatusSchema.options.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}<option value="weak">Low confidence (started)</option><option value="due">Review due</option></select></label>
      <p role="status" className="text-sm text-muted sm:col-span-2">{filtered.length} of {data.catalog.topics.length} topics match.</p>
      <button className="min-h-11 text-sm font-semibold text-accent underline" onClick={() => { setSearch(""); setSectionId("all"); setFilter("all") }}>Clear filters</button>
    </section>
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-2">
      <div className="space-y-5">{data.catalog.sections.map((section) => {
        const topics = filtered.filter((t) => t.sectionId === section.id)
        if (!topics.length) return null
        return <section className="panel" key={section.id} aria-labelledby={section.id}>
          <p className="eyebrow">{section.code}</p><h2 id={section.id} className="mt-2 text-xl font-semibold">{section.name}</h2>
          {data.catalog.groups.filter((g) => g.sectionId === section.id).map((group) => {
            const groupTopics = topics.filter((t) => t.groupId === group.id)
            if (!groupTopics.length) return null
            return <details open key={group.id} className="mt-5 border-t border-line pt-3">
              <summary className="cursor-pointer py-2 font-semibold">{group.name} <span className="text-sm font-normal text-muted">({groupTopics.length})</span></summary>
              <ul className="mt-2 space-y-2">{groupTopics.map((topic) => {
                const progress = progressMap.get(topic.id) ?? emptyTopicProgress(topic.id, topic.defaultPriority)
                return <li key={topic.id}><a href="#topic-editor" onClick={() => setSelectedId(topic.id)} aria-current={selectedId === topic.id ? "true" : undefined} className={`block rounded-xl border p-4 ${selectedId === topic.id ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-muted"}`}>
                  <span className="block font-semibold">{topic.title}</span><span className="mt-1 block text-xs text-muted">{statusLabels[progress.status]} · {topic.estimatedMinutes} min block · {progress.status === "not_started" ? "Confidence not assessed" : `Confidence ${progress.confidence}/5`}</span>
                  {isDateDue(progress.reviewDueOn, data.today) && <span className="mt-2 block text-xs font-semibold text-warning">Review due {progress.reviewDueOn}</span>}
                </a></li>
              })}</ul>
            </details>
          })}
        </section>
      })}{!filtered.length && <div className="panel"><h2 className="font-semibold">No matching topics</h2><p className="mt-2 text-muted">Clear filters or try a broader search.</p></div>}</div>
      <div className="xl:sticky xl:top-6">{selected ? <TopicEditor key={selected.id} topic={selected} progress={progressMap.get(selected.id) ?? emptyTopicProgress(selected.id, selected.defaultPriority)} revision={data.revision} timezone={data.preferences.timezone} onSaved={onSaved} /> : <section id="topic-editor" className="panel"><h2 className="font-semibold">Choose a topic</h2><p className="mt-2 text-muted">Open any topic to update its status, confidence, priority and study time.</p></section>}</div>
    </div>
    <p className="mt-8 text-xs leading-5 text-muted">{data.catalog.disclaimer}</p>
  </>
}
