import { ArrowRight, BookOpen, CheckCircle2, Clock3, RotateCcw, Target } from "lucide-react"
import { Button } from "@/components/button"
import type { CatWorkspaceData } from "@/lib/workspace"
import { isDateDue } from "@/lib/dates"

export function DashboardOverview({ data }: { data: CatWorkspaceData }) {
  const dueCount = data.progress.filter((item) => isDateDue(item.reviewDueOn, data.today)).length
  const todayTasks = data.activePlan?.tasks ?? []
  const completedMinutes = todayTasks.filter((task) => task.status === "completed").reduce((sum, task) => sum + task.plannedMinutes, 0)
  const nextTask = todayTasks.find((task) => task.status === "planned" || task.status === "in_progress")
  const topics = new Map(data.catalog.topics.map((topic) => [topic.id, topic]))
  const nextTopic = nextTask ? topics.get(nextTask.topicId) : undefined
  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">CAT preparation · {data.catalog.version}</p><h1 className="page-title">Make today count.</h1><p className="mt-3 max-w-2xl text-muted">Your syllabus, the work you have saved, and the next useful step.</p></div>
      <Button href="/dashboard/plan">{data.activePlan ? "Open study plan" : "Build today’s plan"}<ArrowRight className="ml-2 size-4" /></Button>
    </div>
    <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Target} label="Overall progress" value={`${data.summary.progressPercent}%`} detail={`${data.summary.masteredTopics} of ${data.summary.totalTopics} topics mastered`} />
      <Metric icon={RotateCcw} label="Review due" value={String(dueCount)} detail={`${data.summary.needsRevisionTopics} topics marked for revision`} />
      <Metric icon={Clock3} label="Planned today" value={`${data.activePlan?.totalMinutes ?? 0}m`} detail={`${completedMinutes} estimated block minutes completed`} />
      <Metric icon={CheckCircle2} label="Confidence average" value={data.summary.averageConfidence ? `${data.summary.averageConfidence}/5` : "Not assessed"} detail="Self-ratings on started topics only" />
    </div>
    <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="panel">
        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Section pulse</p><h2 className="mt-2 text-xl font-semibold">Where your syllabus stands</h2></div><BookOpen className="size-5 text-accent" /></div>
        <div className="mt-6 space-y-5">{data.catalog.sections.map((section) => {
          const summary = data.summary.sectionSummaries.find((s) => s.sectionId === section.id)
          if (!summary) return null
          return <div key={section.id}>
            <div className="flex flex-wrap justify-between gap-3 text-sm"><span className="font-semibold">{section.code}</span><span className="text-muted">{summary.progressPercent}% · {summary.averageConfidence ? `${summary.averageConfidence}/5 confidence` : "Confidence unassessed"}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label={`${section.code} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progressPercent}><div className="h-full rounded-full bg-accent" style={{ width: `${summary.progressPercent}%` }} /></div>
            <p className="mt-2 text-xs text-muted">{summary.masteredTopics} mastered · {summary.needsRevisionTopics} need revision · {summary.totalTopics} topics</p>
          </div>
        })}</div>
      </section>
      <section className="panel">
        <p className="eyebrow">Next action</p><h2 className="mt-2 text-xl font-semibold">{nextTopic?.title ?? "Choose a focused starting point"}</h2>
        <p className="mt-5 leading-7 text-muted">{nextTask?.reason ?? "Generate a plan from your daily time budget. It uses saved topic progress and review dates."}</p>
        <Button href="/dashboard/plan" className="mt-6">{nextTask ? "Resume plan" : "Generate a plan"}<ArrowRight className="ml-2 size-4" /></Button>
      </section>
    </div>
    <section className="panel mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Today’s queue</p><h2 className="mt-2 text-xl font-semibold">{todayTasks.length ? `${todayTasks.length} saved tasks` : "No plan generated yet"}</h2></div><Button href="/dashboard/syllabus" variant="secondary">Browse syllabus</Button></div>
      {todayTasks.length ? <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{todayTasks.map((task) => <li key={task.id} className="rounded-xl bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{task.status.replace("_", " ")}</p><h3 className="mt-3 font-semibold">{topics.get(task.topicId)?.title ?? "Archived topic"}</h3><p className="mt-2 text-sm leading-6 text-muted">{task.plannedMinutes} min · {task.reason}</p>
      </li>)}</ol> : <div className="mt-6 rounded-xl bg-accent-soft p-5"><p className="font-medium text-accent-strong">Start with one realistic study block.</p><p className="mt-2 text-sm leading-6 text-muted">Set your daily budget and build a queue when you are ready. No practice history or mastery is assumed.</p></div>}
    </section>
    <p className="mt-8 text-xs leading-5 text-muted">{data.catalog.disclaimer}</p>
    <p className="mt-3 text-xs leading-5 text-muted">Progress is a self-reported learning index, not an exam-readiness score. Learning 30%, practising 60%, revision 45%, mastery 84–100% depending on confidence.</p>
  </>
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Target; label: string; value: string; detail: string }) {
  return <div className="panel"><Icon className="size-5 text-accent" /><p className="mt-6 text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs leading-5 text-muted">{detail}</p></div>
}
