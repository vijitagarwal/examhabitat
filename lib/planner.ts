import { dateSchema, daysBetween, isDateDue } from "@/lib/dates"
import { emptyTopicProgress, studyPreferencesSchema, type StudyPreferences, type TopicProgress } from "@/lib/progress"
import type { CatSyllabusTopic } from "@/lib/cat-syllabus"

export const PLANNER_ALGORITHM_VERSION = "cat-planner-v1"

export type PlannedStudyTask = { topicId: string; position: number; plannedMinutes: number; reason: string }
export type PlannerResult = { algorithmVersion: string; tasks: PlannedStudyTask[]; totalMinutes: number; skippedTopics: { topicId: string; reason: string }[] }
export type RetainedTask = { topicId: string; position: number; plannedMinutes: number; status: "planned" | "in_progress" | "completed" | "skipped" }
export type PlannerInput = {
  topics: CatSyllabusTopic[]
  progressByTopic: ReadonlyMap<string, TopicProgress>
  preferences: StudyPreferences
  referenceDate: string
  existingTasks?: RetainedTask[]
  excludedTopicIds?: ReadonlySet<string>
}

export function generateStudyQueue(input: PlannerInput): PlannerResult {
  const preferences = studyPreferencesSchema.parse(input.preferences)
  dateSchema.parse(input.referenceDate)
  const retained = (input.existingTasks ?? []).filter((task) => task.status !== "planned")
  const charged = retained.filter((task) => task.status !== "skipped")
  const usedMinutes = charged.reduce((total, task) => total + task.plannedMinutes, 0)
  if (usedMinutes > preferences.dailyMinutes || charged.length > preferences.maxTasks) {
    throw new Error("The budget or task limit is below work already completed or in progress today.")
  }
  const excluded = new Set([...input.excludedTopicIds ?? [], ...retained.map((task) => task.topicId)])
  const topics = new Map(input.topics.map((topic) => [topic.id, topic]))
  if (topics.size !== input.topics.length) throw new Error("Duplicate catalog topic IDs.")
  const progressFor = (topic: CatSyllabusTopic) => input.progressByTopic.get(topic.id) ?? emptyTopicProgress(topic.id, topic.defaultPriority)
  const scores = new Map(input.topics.map((topic) => {
    const progress = progressFor(topic)
    const due = isDateDue(progress.reviewDueOn, input.referenceDate)
    const score = (due ? 300 + Math.min(90, daysBetween(progress.reviewDueOn!, input.referenceDate)) : 0)
      + ({ not_started: 100, learning: 55, practising: 45, needs_revision: 90, mastered: 0 }[progress.status])
      + (5 - progress.confidence) * 9 + progress.priority * 10 + topic.defaultPriority * 3
    const reason = due ? "Review is due; refresh this topic before it fades."
      : progress.status === "not_started" ? "Untouched foundation; start with a focused first pass."
      : progress.status === "needs_revision" ? "You marked this topic for revision."
      : progress.confidence <= 2 ? "Low saved confidence makes another pass worthwhile."
      : "Selected for your priority and ongoing learning progress."
    return [topic.id, { score, reason }] as const
  }))
  const ordered = [...input.topics].sort((a, b) => scores.get(b.id)!.score - scores.get(a.id)!.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const selected = new Set<string>()
  const tasks: PlannedStudyTask[] = []
  const skippedTopics: PlannerResult["skippedTopics"] = []
  let remaining = preferences.dailyMinutes - usedMinutes
  const slots = preferences.maxTasks - charged.length
  let position = Math.max(0, ...retained.map((task) => task.position))

  function chain(topic: CatSyllabusTopic, visiting: Set<string>, result: CatSyllabusTopic[]) {
    if (visiting.has(topic.id)) throw new Error("Cyclic prerequisite catalog.")
    if (selected.has(topic.id) || result.some((item) => item.id === topic.id)) return
    visiting.add(topic.id)
    for (const id of [...topic.prerequisiteIds].sort()) {
      const prerequisite = topics.get(id)
      if (!prerequisite) throw new Error("Missing prerequisite catalog topic.")
      // Practising is enough to start a dependent topic. Completion alone is not mastery.
      if (["practising", "mastered"].includes(progressFor(prerequisite).status) || selected.has(id)) continue
      if (excluded.has(id)) throw new Error("Prerequisite is already handled or in progress today; revisit this dependent topic later.")
      chain(prerequisite, visiting, result)
    }
    visiting.delete(topic.id)
    result.push(topic)
  }

  for (const topic of ordered) {
    if (excluded.has(topic.id) || selected.has(topic.id) || tasks.length >= slots) continue
    const progress = progressFor(topic)
    if (progress.status === "mastered" && !isDateDue(progress.reviewDueOn, input.referenceDate)) continue
    const sequence: CatSyllabusTopic[] = []
    try { chain(topic, new Set(), sequence) } catch (error) {
      if (error instanceof Error && error.message.startsWith("Prerequisite is")) {
        skippedTopics.push({ topicId: topic.id, reason: error.message }); continue
      }
      throw error
    }
    const duration = sequence.reduce((sum, item) => sum + item.estimatedMinutes, 0)
    if (duration > remaining || sequence.length > slots - tasks.length) {
      skippedTopics.push({ topicId: topic.id, reason: "This topic and its prerequisites do not fit the remaining time or task limit." })
      continue
    }
    for (const item of sequence) {
      tasks.push({ topicId: item.id, position: ++position, plannedMinutes: item.estimatedMinutes,
        reason: item.id === topic.id ? scores.get(item.id)!.reason : `Foundation before ${topic.title}.` })
      selected.add(item.id)
      remaining -= item.estimatedMinutes
    }
  }
  return { algorithmVersion: PLANNER_ALGORITHM_VERSION, tasks, totalMinutes: preferences.dailyMinutes - remaining, skippedTopics }
}
