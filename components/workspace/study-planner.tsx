"use client"

import { useState, type FormEvent } from "react"
import { generateAndSaveStudyPlan, saveStudyPreferences, updateStudyTaskStatus } from "@/app/dashboard/actions"
import { Button } from "@/components/button"
import type { CatWorkspaceData, WorkspacePlan, WorkspacePlanTask } from "@/lib/workspace"
import { useWorkspaceMutation } from "./use-mutation"
import { MutationMessage } from "./mutation-message"

export function StudyPlanner({ data, onSaved }: { data: CatWorkspaceData; onSaved: (data: CatWorkspaceData) => void }) {
  const [dailyMinutes, setDailyMinutes] = useState(String(data.preferences.dailyMinutes))
  const [maxTasks, setMaxTasks] = useState(String(data.preferences.maxTasks))
  const [timezone, setTimezone] = useState(data.preferences.timezone)
  const [targetDate, setTargetDate] = useState(data.preferences.targetDate ?? "")
  const mutation = useWorkspaceMutation(onSaved)
  const payload = () => ({ preferences: { dailyMinutes: Number(dailyMinutes), maxTasks: Number(maxTasks), timezone, targetDate: targetDate || null } })
  function save(event: FormEvent) {
    event.preventDefault()
    void mutation.run(saveStudyPreferences, payload(), data.revision, "Planning preferences saved. Existing tasks are unchanged.")
  }
  return <>
    <p className="eyebrow">Your daily study queue</p><h1 className="page-title">A plan you can finish.</h1>
    <p className="mt-3 text-muted">{data.today} · {data.preferences.timezone}. Based on your saved progress, not a prediction of exam performance.</p>
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(260px,.8fr)_minmax(0,1.4fr)]">
      <section className="panel"><h2 className="text-xl font-semibold">Planning preferences</h2>
        <form onSubmit={save} className="mt-5 space-y-4">
          <fieldset disabled={mutation.pending} className="space-y-4"><legend className="sr-only">Study availability</legend>
            <label className="field-label">Daily minutes<input type="number" min={15} max={360} step={1} required className="field-input" value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} /></label>
            <label className="field-label">Maximum daily tasks<input type="number" min={1} max={12} step={1} required className="field-input" value={maxTasks} onChange={(e) => setMaxTasks(e.target.value)} /></label>
            <label className="field-label">Time zone<input required className="field-input" list="timezones" value={timezone} onChange={(e) => setTimezone(e.target.value)} /><datalist id="timezones"><option value="Asia/Kolkata" /><option value="UTC" /><option value="Europe/London" /><option value="America/New_York" /></datalist></label>
            <label className="field-label">Personal target date (optional)<input type="date" className="field-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label>
          </fieldset>
          <p className="text-xs leading-5 text-muted">Your target date is a planning note, not an official exam date. It does not change daily capacity.</p>
          <Button type="submit" disabled={mutation.pending} variant="secondary">{mutation.pending ? "Saving…" : "Save preferences"}</Button>
        </form>
        <Button type="button" disabled={mutation.pending} className="mt-4 w-full" onClick={() => void mutation.run(generateAndSaveStudyPlan, payload(), data.revision, "Study queue saved. Completed, skipped and in-progress work was preserved.")}>{mutation.pending ? "Working…" : data.activePlan ? "Regenerate today’s queue" : "Generate today’s queue"}</Button>
        <MutationMessage message={mutation.message} />
        <p className="mt-5 text-xs leading-6 text-muted">Generation saves these preferences too. Regeneration replaces only tasks you haven’t started. Completed and in-progress blocks consume today’s budget; skipped topics stay skipped today.</p>
      </section>
      <div className="space-y-5">{data.activePlan ? <PlanView plan={data.activePlan} data={data} onSaved={onSaved} /> : <section className="panel"><h2 className="text-xl font-semibold">No plan saved for today</h2><p className="mt-3 leading-7 text-muted">Choose a realistic budget, then generate your first queue. A 15-minute budget can be too small for a complete study block; no oversized task will be forced into it.</p></section>}
        <section className="panel"><h2 className="font-semibold">Why these topics?</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>Due revision gets priority, including mastered topics.</li><li>Untouched topics, low confidence and your priorities guide the remaining order.</li><li>Needed foundations come before dependent topics.</li><li>A topic and its prerequisite blocks must fit both remaining time and task slots.</li></ul></section>
      </div>
    </div>
    <section className="mt-8"><h2 className="text-xl font-semibold">Recent saved plans</h2><p className="mt-2 text-sm text-muted">Up to 14 planning days. Older records remain in your account.</p>
      {data.plans.filter((p) => p.planDate !== data.today).length ? data.plans.filter((p) => p.planDate !== data.today).map((plan) => <details key={plan.id} className="mt-4 rounded-2xl border border-line bg-surface p-5"><summary className="cursor-pointer py-2 font-semibold">{plan.planDate} · {plan.tasks.filter((t) => t.status === "completed").length} completed blocks</summary><PlanView plan={plan} data={data} onSaved={onSaved} /></details>) : <p className="mt-3 text-sm text-muted">Your saved plans will appear here as you study on more days.</p>}
    </section>
  </>
}

function PlanView({ plan, data, onSaved }: { plan: WorkspacePlan; data: CatWorkspaceData; onSaved: (data: CatWorkspaceData) => void }) {
  const completed = plan.tasks.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.plannedMinutes, 0)
  return <section className="panel"><h2 className="text-xl font-semibold">Saved queue · {plan.planDate}</h2>
    <p className="mt-2 text-sm text-muted">{plan.totalMinutes}/{plan.dailyBudget} planned minutes · {completed} completed block minutes</p>
    <p className="mt-2 text-xs text-muted">Block minutes are estimates you confirm, not a measured timer. Completion never automatically changes mastery or confidence.</p>
    {!plan.tasks.some((t) => ["planned", "in_progress"].includes(t.status)) && <p role="status" className="mt-4 rounded-xl bg-accent-soft p-4 text-sm text-accent-strong">No remaining tasks in this queue. Work may be finished, review may not be due, or another complete block may not fit. Adjust capacity and regenerate if needed.</p>}
    <ol className="mt-5 space-y-4">{plan.tasks.map((task) => <TaskCard key={task.id} task={task} data={data} onSaved={onSaved} />)}</ol>
  </section>
}

function TaskCard({ task, data, onSaved }: { task: WorkspacePlanTask; data: CatWorkspaceData; onSaved: (data: CatWorkspaceData) => void }) {
  const mutation = useWorkspaceMutation(onSaved)
  const topic = data.catalog.topics.find((t) => t.id === task.topicId)
  const finished = ["completed", "skipped"].includes(task.status)
  const change = (status: "in_progress" | "completed" | "skipped") => void mutation.run(updateStudyTaskStatus, { taskId: task.id, status }, data.revision, "Task status saved.")
  return <li className="rounded-xl border border-line p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{task.status.replace("_", " ")}</p>
    <h3 className="mt-2 font-semibold">{topic?.title ?? task.topicId}</h3><p className="mt-1 text-sm text-muted">{task.plannedMinutes} minute block</p><p className="mt-2 text-sm leading-6 text-muted">{task.reason}</p>
    {!finished && <div className="mt-4 flex flex-wrap gap-2">{task.status === "planned" && <Button disabled={mutation.pending} variant="secondary" onClick={() => change("in_progress")}>Start task</Button>}<Button disabled={mutation.pending} onClick={() => change("completed")}>Complete block</Button><Button disabled={mutation.pending} variant="ghost" onClick={() => change("skipped")}>Skip today</Button></div>}
    <MutationMessage message={mutation.message} />
  </li>
}
