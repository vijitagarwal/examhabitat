"use client"

import { useId, useState, type FormEvent } from "react"
import { Save } from "lucide-react"
import { saveTopicProgress } from "@/app/dashboard/actions"
import { Button } from "@/components/button"
import { canTransitionTopicStatus, statusLabels, topicStatusSchema, type TopicProgress } from "@/lib/progress"
import type { CatSyllabusTopic } from "@/lib/cat-syllabus"
import type { CatWorkspaceData } from "@/lib/workspace"
import { useWorkspaceMutation } from "./use-mutation"
import { MutationMessage } from "./mutation-message"

export function TopicEditor({ topic, progress, revision, timezone, onSaved }: {
  topic: CatSyllabusTopic; progress: TopicProgress; revision: number; timezone: string; onSaved: (data: CatWorkspaceData) => void
}) {
  const id = useId()
  const [status, setStatus] = useState(progress.status)
  const [confidence, setConfidence] = useState(String(progress.confidence))
  const [priority, setPriority] = useState(String(progress.priority))
  const [minutes, setMinutes] = useState("0")
  const mutation = useWorkspaceMutation(onSaved)
  async function save(event: FormEvent) {
    event.preventDefault()
    if (await mutation.run(saveTopicProgress, { topicId: topic.id, status, confidence: Number(confidence), priority: Number(priority), minutesStudied: Number(minutes) }, revision, "Progress saved to your account.")) setMinutes("0")
  }
  return <section id="topic-editor" aria-labelledby={`${id}-heading`} className="rounded-2xl border border-line bg-surface p-6">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-accent">Topic detail</p>
    <h2 id={`${id}-heading`} className="mt-2 text-2xl font-semibold tracking-tight">{topic.title}</h2>
    <p className="mt-3 leading-7 text-muted">{topic.description}</p>
    <p className="mt-3 text-sm text-muted">{topic.estimatedMinutes} minute study-block estimate · difficulty {topic.difficulty}/5</p>
    <Button className="mt-4" variant="secondary" href={`/dashboard/practice?topicId=${encodeURIComponent(topic.id)}`}>Practise this topic</Button>
    <form onSubmit={save} className="mt-6">
      <fieldset disabled={mutation.pending} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Update {topic.title}</legend>
        <label htmlFor={`${id}-status`} className="field-label">Learning status
          <select id={`${id}-status`} value={status} onChange={(event) => { const value = topicStatusSchema.safeParse(event.target.value); if (value.success) setStatus(value.data) }} className="field-input">
            {topicStatusSchema.options.map((value) => <option key={value} value={value} disabled={!canTransitionTopicStatus(progress.status, value)}>{statusLabels[value]}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-confidence`} className="field-label">Confidence · 1 low, 5 high
          <select id={`${id}-confidence`} value={confidence} onChange={(event) => setConfidence(event.target.value)} className="field-input">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select>
        </label>
        <label htmlFor={`${id}-priority`} className="field-label">Study priority · 5 highest
          <select id={`${id}-priority`} value={priority} onChange={(event) => setPriority(event.target.value)} className="field-input">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select>
        </label>
        <label htmlFor={`${id}-minutes`} className="field-label">Add study minutes
          <input id={`${id}-minutes`} type="number" required min={0} max={240} step={1} value={minutes} onChange={(event) => setMinutes(event.target.value)} className="field-input" />
        </label>
      </fieldset>
      <p className="mt-3 text-xs leading-5 text-muted">Start with Learning, then Practising, then Mastered. You can return to revision later. Logging time is separate from completing planned blocks.</p>
      <Button type="submit" disabled={mutation.pending} className="mt-5"><Save className="mr-2 size-4" />{mutation.pending ? "Saving…" : "Save progress"}</Button>
      <MutationMessage message={mutation.message} />
    </form>
    <dl className="mt-6 grid gap-3 border-t border-line pt-4 text-sm">
      <div><dt className="text-muted">Manually logged study</dt><dd>{progress.accumulatedMinutes} minutes</dd></div>
      <div><dt className="text-muted">Last logged study · {timezone}</dt><dd>{progress.lastStudiedAt ? new Intl.DateTimeFormat("en-IN", { timeZone: timezone, dateStyle: "medium" }).format(new Date(progress.lastStudiedAt)) : "No study time logged yet"}</dd></div>
      <div><dt className="text-muted">Review due</dt><dd>{progress.reviewDueOn ?? "Set after you start learning"}</dd></div>
    </dl>
  </section>
}
