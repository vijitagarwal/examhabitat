import { z } from "zod"
import type { CatSectionCode, CatSyllabusSection, CatSyllabusTopic } from "@/lib/cat-syllabus"

export const ANALYTICS_WINDOW_DAYS = 90
export const RECOMMENDATION_ALGORITHM_VERSION = "performance-v1"
export const metricEvidenceSchema = z.enum(["none", "limited", "supported"])
export type MetricEvidence = z.infer<typeof metricEvidenceSchema>

const rawMetricSchema = z.object({
  attempts: z.number().int().nonnegative(), totalQuestions: z.number().int().nonnegative(),
  answeredQuestions: z.number().int().nonnegative(), correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(), unanswered: z.number().int().nonnegative(), skipped: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(100).nullable(),
})
export type PerformanceMetric = z.infer<typeof rawMetricSchema> & { evidence: MetricEvidence }
const rawSectionSchema = rawMetricSchema.extend({ section: z.enum(["VARC", "DILR", "QA"]) })
const rawTopicSchema = rawMetricSchema.extend({
  topicId: z.string(), topicTitle: z.string(), section: z.enum(["VARC", "DILR", "QA"]),
  lastPractisedAt: z.string().nullable(), incorrectAttempts: z.number().int().nonnegative(),
  recentAnsweredQuestions: z.number().int().nonnegative(), recentCorrect: z.number().int().nonnegative(), recentAccuracy: z.number().min(0).max(100).nullable(),
})
export const scoreHistorySchema = z.object({
  id: z.string().uuid(), mode: z.enum(["practice", "timed"]), status: z.enum(["submitted", "expired"]),
  startedAt: z.string(), finishedAt: z.string(), score: z.number(), maxScore: z.number(), accuracy: z.number().min(0).max(100).nullable(),
  totalQuestions: z.number().int().positive(), answeredQuestions: z.number().int().nonnegative(), elapsedSeconds: z.number().nonnegative().nullable(),
  policyKey: z.string(), compositionKey: z.string(), comparableToLatest: z.boolean(),
})
export const rawAnalyticsSchema = z.object({
  windowDays: z.number().int().min(7).max(3650), windowStartedAt: z.string(),
  startedAttempts: z.number().int().nonnegative(), finalizedAttempts: z.number().int().nonnegative(), activeAttempts: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(100).nullable(), overall: rawMetricSchema,
  sections: z.array(rawSectionSchema), topics: z.array(rawTopicSchema), scoreHistory: z.array(scoreHistorySchema), recentTrend: z.array(scoreHistorySchema),
  timing: z.object({ attemptsWithTiming: z.number().int().nonnegative(), totalElapsedSeconds: z.number().nonnegative(), averageElapsedSeconds: z.number().nonnegative().nullable(), averageSecondsPerQuestion: z.number().nonnegative().nullable() }),
})
export type RawPerformanceAnalytics = z.infer<typeof rawAnalyticsSchema>
export const performanceMetricSchema = rawMetricSchema.extend({ evidence: metricEvidenceSchema })
export const sectionAnalyticsSchema = performanceMetricSchema.extend({ section: z.enum(["VARC", "DILR", "QA"]), name: z.string() })
export const topicAnalyticsSchema = performanceMetricSchema.extend({
  topicId: z.string(), topicTitle: z.string(), section: z.enum(["VARC", "DILR", "QA"]), sectionName: z.string(),
  lastPractisedAt: z.string().nullable(), incorrectAttempts: z.number().int().nonnegative(),
  recentAnsweredQuestions: z.number().int().nonnegative(), recentCorrect: z.number().int().nonnegative(), recentAccuracy: z.number().min(0).max(100).nullable(),
})
export const recommendationSchema = z.object({
  id: z.string(), kind: z.enum(["weak_topic", "revisit_topic", "insufficient_topic", "section_gap", "mistakes", "start_practice"]),
  title: z.string(), reason: z.string(), topicId: z.string().nullable(), action: z.enum(["practice", "syllabus", "mistakes", "plan"]),
})
export type PerformanceRecommendation = z.infer<typeof recommendationSchema>
export const performanceAnalyticsSchema = z.object({
  windowDays: z.number().int().min(7).max(3650), windowStartedAt: z.string(),
  startedAttempts: z.number().int().nonnegative(), finalizedAttempts: z.number().int().nonnegative(), activeAttempts: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(100).nullable(), overall: performanceMetricSchema,
  sections: z.array(sectionAnalyticsSchema), topics: z.array(topicAnalyticsSchema), scoreHistory: z.array(scoreHistorySchema), recentTrend: z.array(scoreHistorySchema),
  timing: z.object({ attemptsWithTiming: z.number().int().nonnegative(), totalElapsedSeconds: z.number().nonnegative(), averageElapsedSeconds: z.number().nonnegative().nullable(), averageSecondsPerQuestion: z.number().nonnegative().nullable() }),
  recommendations: z.array(recommendationSchema),
})
export type PerformanceAnalytics = z.infer<typeof performanceAnalyticsSchema>

function evidenceFor(answeredQuestions: number): MetricEvidence {
  return answeredQuestions >= 5 ? "supported" : answeredQuestions > 0 ? "limited" : "none"
}
function withEvidence(metric: z.infer<typeof rawMetricSchema>): PerformanceMetric {
  return { ...metric, evidence: evidenceFor(metric.answeredQuestions) }
}
function emptyMetric(): z.infer<typeof rawMetricSchema> {
  return { attempts: 0, totalQuestions: 0, answeredQuestions: 0, correct: 0, incorrect: 0, unanswered: 0, skipped: 0, accuracy: null }
}
function daysSince(value: string | null, reference = Date.now()) {
  return value ? Math.max(0, Math.floor((reference - Date.parse(value)) / 86_400_000)) : null
}

// Kept as a separate function so thresholds and copy can be tested without rendering or SQL.
export function recommendPerformance(topics: z.infer<typeof topicAnalyticsSchema>[], sections: z.infer<typeof sectionAnalyticsSchema>[], overall: PerformanceMetric): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = []
  const weak = topics.filter((topic) => topic.answeredQuestions >= 3 && topic.accuracy !== null && topic.accuracy <= 50)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || b.incorrectAttempts - a.incorrectAttempts || a.topicId.localeCompare(b.topicId))
  for (const topic of weak.slice(0, 3)) {
    recommendations.push({ id: `weak:${topic.topicId}`, kind: "weak_topic", topicId: topic.topicId, action: "practice", title: `Practise ${topic.topicTitle}`, reason: `${topic.incorrect} incorrect answers from ${topic.answeredQuestions} attempted questions (${topic.accuracy}%).` })
  }
  const stale = topics.filter((topic) => topic.answeredQuestions >= 3 && (daysSince(topic.lastPractisedAt) ?? 0) >= 14)
    .sort((a, b) => (daysSince(b.lastPractisedAt) ?? 0) - (daysSince(a.lastPractisedAt) ?? 0) || a.topicId.localeCompare(b.topicId))
  for (const topic of stale.slice(0, 2)) {
    if (recommendations.some((item) => item.topicId === topic.topicId)) continue
    recommendations.push({ id: `stale:${topic.topicId}`, kind: "revisit_topic", topicId: topic.topicId, action: "practice", title: `Revisit ${topic.topicTitle}`, reason: `Last practised ${daysSince(topic.lastPractisedAt)} days ago; a fresh attempt will show whether the skill held.` })
  }
  const sectionGap = sections.filter((section) => section.answeredQuestions > 0 && section.answeredQuestions < 5)
    .sort((a, b) => a.answeredQuestions - b.answeredQuestions || a.section.localeCompare(b.section))[0]
  if (sectionGap && recommendations.length < 5) recommendations.push({ id: `section:${sectionGap.section}`, kind: "section_gap", topicId: null, action: "practice", title: `Build ${sectionGap.section} evidence`, reason: `${sectionGap.answeredQuestions} answered questions is not enough for a dependable section comparison; practise a few more before drawing conclusions.` })
  const unanswered = overall.unanswered
  if (unanswered > 0 && recommendations.length < 5) recommendations.push({ id: "mistakes:unanswered", kind: "mistakes", topicId: null, action: "mistakes", title: "Review skipped questions", reason: `${unanswered} questions were unanswered or skipped in the selected window.` })
  if (!recommendations.length && overall.answeredQuestions === 0) recommendations.push({ id: "start", kind: "start_practice", topicId: null, action: "practice", title: "Complete a short practice session", reason: "Finalized attempts are needed before performance recommendations can be supported by evidence." })
  if (!recommendations.length && overall.answeredQuestions > 0) recommendations.push({ id: "plan", kind: "section_gap", topicId: null, action: "plan", title: "Keep the routine consistent", reason: "No topic crosses the current evidence thresholds for a specific warning. Use the planner to maintain balanced practice." })
  return recommendations.slice(0, 5)
}

export function createPerformanceAnalytics(rawValue: unknown, catalogTopics: CatSyllabusTopic[], catalogSections: CatSyllabusSection[]): PerformanceAnalytics {
  const raw = rawAnalyticsSchema.parse(rawValue)
  const sectionNames = new Map(catalogSections.map((section) => [section.code, section.name]))
  const rawByTopic = new Map(raw.topics.map((topic) => [topic.topicId, topic]))
  const topicRows = catalogTopics.map((topic) => {
    const saved = rawByTopic.get(topic.id)
    const metric = saved ? withEvidence(saved) : withEvidence(emptyMetric())
    const currentSection = (catalogSections.find((section) => section.id === topic.sectionId)?.code ?? "QA") as CatSectionCode
    const reportedSection = saved?.section ?? currentSection
    return { ...metric, topicId: topic.id, topicTitle: saved?.topicTitle ?? topic.title, section: reportedSection,
      sectionName: sectionNames.get(reportedSection) ?? "Quantitative Aptitude",
      lastPractisedAt: saved?.lastPractisedAt ?? null, incorrectAttempts: saved?.incorrectAttempts ?? 0, recentAnsweredQuestions: saved?.recentAnsweredQuestions ?? 0,
      recentCorrect: saved?.recentCorrect ?? 0, recentAccuracy: saved?.recentAccuracy ?? null }
  })
  // Preserve historical topic IDs if a future catalog version no longer lists one.
  for (const saved of raw.topics) if (!topicRows.some((topic) => topic.topicId === saved.topicId)) {
    const metric = withEvidence(saved)
    topicRows.push({ ...metric, topicId: saved.topicId, topicTitle: saved.topicTitle, section: saved.section, sectionName: sectionNames.get(saved.section) ?? saved.section,
      lastPractisedAt: saved.lastPractisedAt, incorrectAttempts: saved.incorrectAttempts, recentAnsweredQuestions: saved.recentAnsweredQuestions, recentCorrect: saved.recentCorrect, recentAccuracy: saved.recentAccuracy })
  }
  const sectionRows = (["VARC", "DILR", "QA"] as const).map((code) => {
    const saved = raw.sections.find((section) => section.section === code)
    return { ...(saved ? withEvidence(saved) : withEvidence(emptyMetric())), section: code, name: sectionNames.get(code) ?? code }
  })
  const overall = withEvidence(raw.overall)
  return performanceAnalyticsSchema.parse({ ...raw, overall, sections: sectionRows, topics: topicRows, recommendations: recommendPerformance(topicRows, sectionRows, overall) })
}
