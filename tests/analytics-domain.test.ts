import { describe, expect, it } from "vitest"
import { createPerformanceAnalytics, recommendPerformance, type RawPerformanceAnalytics } from "@/lib/analytics"
import { catSections, catTopics } from "@/lib/cat-syllabus"

const metric = { attempts: 0, totalQuestions: 0, answeredQuestions: 0, correct: 0, incorrect: 0, unanswered: 0, skipped: 0, accuracy: null }
const raw: RawPerformanceAnalytics = {
  windowDays: 90, windowStartedAt: "2026-01-01T00:00:00Z", startedAttempts: 3, finalizedAttempts: 2, activeAttempts: 1, completionRate: 66.67,
  overall: { ...metric, attempts: 2, totalQuestions: 8, answeredQuestions: 6, correct: 3, incorrect: 3, unanswered: 2, accuracy: 50 },
  sections: [{ ...metric, section: "QA", attempts: 2, totalQuestions: 8, answeredQuestions: 6, correct: 3, incorrect: 3, unanswered: 2, accuracy: 50 }],
  topics: [{ ...metric, topicId: catTopics[0].id, topicTitle: catTopics[0].title, section: "VARC", attempts: 2, totalQuestions: 4, answeredQuestions: 4, correct: 1, incorrect: 3, accuracy: 25, lastPractisedAt: "2026-02-01T00:00:00Z", incorrectAttempts: 2, recentAnsweredQuestions: 4, recentCorrect: 1, recentAccuracy: 25 }],
  scoreHistory: [], recentTrend: [], timing: { attemptsWithTiming: 2, totalElapsedSeconds: 600, averageElapsedSeconds: 300, averageSecondsPerQuestion: 75 },
}

describe("performance intelligence definitions", () => {
  it("merges untouched current topics with persisted evidence and labels sample size", () => {
    const result = createPerformanceAnalytics(raw, catTopics.slice(0, 2), catSections)
    expect(result.topics).toHaveLength(2)
    expect(result.topics.find((topic) => topic.topicId === catTopics[0].id)?.evidence).toBe("limited")
    expect(result.topics.find((topic) => topic.topicId === catTopics[1].id)).toMatchObject({ answeredQuestions: 0, accuracy: null, evidence: "none" })
    expect(result.sections).toHaveLength(3)
  })
  it("recommends repeated errors but does not diagnose one-question samples", () => {
    const result = createPerformanceAnalytics(raw, catTopics.slice(0, 1), catSections)
    expect(result.recommendations[0]).toMatchObject({ kind: "weak_topic", topicId: catTopics[0].id, action: "practice" })
    expect(result.recommendations[0].reason).toContain("3 incorrect answers from 4 attempted")
    expect(recommendPerformance([{ ...result.topics[0], answeredQuestions: 1, accuracy: 0 }], result.sections, { ...result.overall, answeredQuestions: 1 })).not.toEqual(expect.arrayContaining([expect.objectContaining({ kind: "weak_topic" })]))
  })
  it("uses unanswered separately from accuracy and gives an honest new-account recommendation", () => {
    const empty = createPerformanceAnalytics({ ...raw, startedAttempts: 0, finalizedAttempts: 0, activeAttempts: 0, completionRate: null, overall: metric, sections: [], topics: [], scoreHistory: [], recentTrend: [], timing: { attemptsWithTiming: 0, totalElapsedSeconds: 0, averageElapsedSeconds: null, averageSecondsPerQuestion: null } }, catTopics.slice(0, 1), catSections)
    expect(empty.overall.accuracy).toBeNull()
    expect(empty.recommendations).toEqual([expect.objectContaining({ kind: "start_practice", action: "practice" })])
  })
})
