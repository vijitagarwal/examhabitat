import { z } from "zod"
import { addDays, dateSchema, isValidTimeZone } from "@/lib/dates"
import type { CatSectionCode, CatSyllabusTopic } from "@/lib/cat-syllabus"

export const topicStatusSchema = z.enum(["not_started", "learning", "practising", "needs_revision", "mastered"])
export type TopicStatus = z.infer<typeof topicStatusSchema>

export const topicProgressInputSchema = z.object({
  topicId: z.string().min(1),
  status: topicStatusSchema,
  confidence: z.number().int().min(1).max(5),
  priority: z.number().int().min(1).max(5),
  minutesStudied: z.number().int().min(0).max(240),
}).strict().refine((value) => value.status !== "not_started" || value.minutesStudied === 0, "Start learning before recording study time.")
export type TopicProgressInput = z.infer<typeof topicProgressInputSchema>

export const studyPreferencesSchema = z.object({
  dailyMinutes: z.number().int().min(15).max(360),
  maxTasks: z.number().int().min(1).max(12),
  timezone: z.string().max(100).refine(isValidTimeZone, "Choose a valid time zone."),
  targetDate: dateSchema.nullable(),
}).strict()
export type StudyPreferences = z.infer<typeof studyPreferencesSchema>

export const progressSchema = z.object({
  topicId: z.string(), status: topicStatusSchema,
  confidence: z.number().int().min(1).max(5), priority: z.number().int().min(1).max(5),
  accumulatedMinutes: z.number().int().nonnegative(), lastStudiedAt: z.string().nullable(),
  reviewDueOn: dateSchema.nullable(), updatedAt: z.string(),
})
export type TopicProgress = z.infer<typeof progressSchema>

export const DEFAULT_STUDY_PREFERENCES: StudyPreferences = { dailyMinutes: 60, maxTasks: 3, timezone: "Asia/Kolkata", targetDate: null }
export const statusLabels: Record<TopicStatus, string> = { not_started: "Not started", learning: "Learning", practising: "Practising", needs_revision: "Needs revision", mastered: "Mastered" }

export type SectionProgressSummary = {
  sectionId: string
  code: CatSectionCode
  totalTopics: number
  masteredTopics: number
  needsRevisionTopics: number
  progressPercent: number
  averageConfidence: number
}

export type ProgressSummary = {
  totalTopics: number
  masteredTopics: number
  needsRevisionTopics: number
  progressPercent: number
  averageConfidence: number
  sectionSummaries: SectionProgressSummary[]
}

const transitionMap: Record<TopicStatus, readonly TopicStatus[]> = {
  not_started: ["not_started", "learning"],
  learning: ["learning", "practising", "needs_revision"],
  practising: ["practising", "needs_revision", "mastered"],
  needs_revision: ["needs_revision", "practising", "mastered"],
  mastered: ["mastered", "needs_revision", "practising"],
}

export function canTransitionTopicStatus(from: TopicStatus, to: TopicStatus) {
  return transitionMap[from].includes(to)
}

export function getReviewDueOn(status: TopicStatus, confidence: number, referenceDate: string) {
  if (status === "not_started") return null
  if (status === "needs_revision") return addDays(referenceDate, 2)
  if (status === "learning") return addDays(referenceDate, confidence <= 2 ? 2 : 4)
  if (status === "practising") return addDays(referenceDate, confidence <= 2 ? 3 : 7)
  return addDays(referenceDate, confidence <= 2 ? 7 : 14)
}

export function emptyTopicProgress(topicId: string, priority = 3): TopicProgress {
  return {
    topicId,
    status: "not_started",
    confidence: 1,
    priority,
    accumulatedMinutes: 0,
    lastStudiedAt: null,
    reviewDueOn: null,
    updatedAt: "",
  }
}

export function getProgressWeight(status: TopicStatus, confidence: number) {
  const base = { not_started: 0, learning: 0.3, practising: 0.6, needs_revision: 0.45, mastered: 1 }[status]
  if (status === "mastered") return base * (0.8 + Math.min(confidence, 5) * 0.04)
  return base
}

export function aggregateProgress(topics: CatSyllabusTopic[], progressByTopic: ReadonlyMap<string, TopicProgress>): ProgressSummary {
  const sectionSummaries = new Map<string, SectionProgressSummary>()
  let totalWeight = 0
  let confidenceTotal = 0
  let masteredTopics = 0
  let needsRevisionTopics = 0

  for (const topic of topics) {
    const progress = progressByTopic.get(topic.id) ?? emptyTopicProgress(topic.id, topic.defaultPriority)
    const section = sectionSummaries.get(topic.sectionId) ?? {
      sectionId: topic.sectionId,
      code: topic.sectionId === "cat-varc" ? "VARC" : topic.sectionId === "cat-dilr" ? "DILR" : "QA",
      totalTopics: 0,
      masteredTopics: 0,
      needsRevisionTopics: 0,
      progressPercent: 0,
      averageConfidence: 0,
    }
    section.totalTopics += 1
    section.progressPercent += getProgressWeight(progress.status, progress.confidence)
    section.averageConfidence += progress.status === "not_started" ? 0 : progress.confidence
    if (progress.status === "mastered") { section.masteredTopics += 1; masteredTopics += 1 }
    if (progress.status === "needs_revision") { section.needsRevisionTopics += 1; needsRevisionTopics += 1 }
    sectionSummaries.set(topic.sectionId, section)
    totalWeight += getProgressWeight(progress.status, progress.confidence)
    confidenceTotal += progress.status === "not_started" ? 0 : progress.confidence
  }

  const summaries = [...sectionSummaries.values()].map((summary) => ({
    ...summary,
    progressPercent: summary.totalTopics ? Math.round((summary.progressPercent / summary.totalTopics) * 100) : 0,
    averageConfidence: (() => {
      const studied = topics.filter((topic) => topic.sectionId === summary.sectionId && progressByTopic.has(topic.id) && progressByTopic.get(topic.id)?.status !== "not_started").length
      return studied ? Math.round((summary.averageConfidence / studied) * 10) / 10 : 0
    })(),
  }))
  return {
    totalTopics: topics.length,
    masteredTopics,
    needsRevisionTopics,
    progressPercent: topics.length ? Math.round((totalWeight / topics.length) * 100) : 0,
    averageConfidence: (() => {
      const studied = topics.filter((topic) => progressByTopic.has(topic.id) && progressByTopic.get(topic.id)?.status !== "not_started").length
      return studied ? Math.round((confidenceTotal / studied) * 10) / 10 : 0
    })(),
    sectionSummaries: summaries,
  }
}
