import { describe, expect, it } from "vitest"
import { catTopics } from "@/lib/cat-syllabus"
import { generateStudyQueue } from "@/lib/planner"
import { emptyTopicProgress, type StudyPreferences, type TopicProgress } from "@/lib/progress"

const preferences: StudyPreferences = { dailyMinutes: 60, maxTasks: 3, timezone: "Asia/Kolkata", targetDate: null }

function progressFor(entries: Partial<TopicProgress>[]) {
  return new Map(entries.map((entry, index) => {
    const topicId = entry.topicId ?? catTopics[index].id
    return [topicId, { ...emptyTopicProgress(topicId), ...entry }] as const
  }))
}

describe("deterministic study planner", () => {
  it("prioritizes untouched and weak topics with an explainable reason", () => {
    const topics = [catTopics[0], catTopics[1], catTopics[5]]
    const result = generateStudyQueue({ topics, progressByTopic: progressFor([{ topicId: catTopics[0].id, status: "learning", confidence: 1, priority: 5 }]), preferences: { ...preferences, dailyMinutes: 120 }, referenceDate: "2026-10-10" })
    expect(result.tasks.length).toBeGreaterThan(0)
    expect(result.tasks[0].reason.length).toBeGreaterThan(10)
    expect(result.tasks.some((task) => task.topicId === catTopics[0].id)).toBe(true)
  })

  it("respects both the daily minute budget and task limit", () => {
    const result = generateStudyQueue({ topics: catTopics, progressByTopic: new Map(), preferences: { ...preferences, dailyMinutes: 60, maxTasks: 2 }, referenceDate: "2026-10-10" })
    expect(result.totalMinutes).toBeLessThanOrEqual(60)
    expect(result.tasks.length).toBeLessThanOrEqual(2)
  })

  it("does not fabricate a task that cannot fit the remaining budget", () => {
    const result = generateStudyQueue({ topics: catTopics.filter((topic) => topic.estimatedMinutes > 20).slice(0, 5), progressByTopic: new Map(), preferences: { ...preferences, dailyMinutes: 20 }, referenceDate: "2026-10-10" })
    expect(result.tasks).toEqual([])
    expect(result.skippedTopics.length).toBeGreaterThan(0)
    expect(result.totalMinutes).toBe(0)
  })

  it("is deterministic for the same reference date and inputs", () => {
    const input = { topics: catTopics.slice(0, 12), progressByTopic: progressFor([{ topicId: catTopics[1].id, status: "needs_revision", confidence: 2, reviewDueOn: "2026-10-09" }]), preferences, referenceDate: "2026-10-10" }
    const first = generateStudyQueue(input)
    const second = generateStudyQueue(input)
    expect(second).toEqual(first)
  })

  it("preserves the ability to generate new work around completed history", () => {
    const completedTopic = catTopics[0]
    const result = generateStudyQueue({ topics: catTopics.slice(0, 8), progressByTopic: progressFor([{ topicId: completedTopic.id, status: "mastered", confidence: 5 }]), preferences, referenceDate: "2026-10-10", excludedTopicIds: new Set([completedTopic.id]) })
    expect(result.tasks.every((task) => task.topicId !== completedTopic.id)).toBe(true)
  })

  it("brings an overdue mastered topic ahead of untouched work", () => {
    const topics = [catTopics[0], catTopics[5]]
    const result = generateStudyQueue({ topics, progressByTopic: progressFor([{ topicId: topics[0].id, status: "mastered", confidence: 5, reviewDueOn: "2026-10-01" }]), preferences: { ...preferences, maxTasks: 1 }, referenceDate: "2026-10-10" })
    expect(result.tasks.map((t) => t.topicId)).toEqual([topics[0].id])
    expect(result.tasks[0].reason).toContain("Review is due")
  })

  it("does not schedule mastered topics before their review date", () => {
    const topic = catTopics[0]
    const result = generateStudyQueue({ topics: [topic], progressByTopic: progressFor([{ topicId: topic.id, status: "mastered", confidence: 5, reviewDueOn: "2026-11-01" }]), preferences, referenceDate: "2026-10-10" })
    expect(result.tasks).toEqual([])
  })

  it("prioritizes lower confidence for otherwise comparable progress", () => {
    const topics = [catTopics[0], catTopics[5]]
    const result = generateStudyQueue({ topics, progressByTopic: progressFor(topics.map((t, i) => ({ topicId: t.id, status: "learning", confidence: i ? 1 : 5, priority: 3 }))), preferences: { ...preferences, maxTasks: 1 }, referenceDate: "2026-10-10" })
    expect(result.tasks[0].topicId).toBe(topics[1].id)
  })

  it("uses repeated practice mistakes as a transparent scheduling signal without changing mastery", () => {
    const weakTopic = catTopics[0]
    const masteredTopic = { ...catTopics[5] }
    const result = generateStudyQueue({ topics: [masteredTopic, weakTopic], progressByTopic: progressFor([
      { topicId: masteredTopic.id, status: "mastered", confidence: 5, reviewDueOn: "2026-12-01" },
    ]), practiceSignals: new Map([[weakTopic.id, { topicId: weakTopic.id, attempted: 4, incorrect: 2 }]]), preferences: { ...preferences, maxTasks: 1 }, referenceDate: "2026-10-10" })
    expect(result.tasks[0]).toMatchObject({ topicId: weakTopic.id })
    expect(result.tasks[0].reason).toContain("minimum 3 answers")
  })

  it("orders transitive prerequisites before a dependent topic without duplicates", () => {
    const topics = [catTopics[0], catTopics[1], catTopics[4]]
    const result = generateStudyQueue({ topics, progressByTopic: progressFor([{ topicId: topics[2].id, status: "needs_revision", reviewDueOn: "2026-10-01" }]), preferences: { ...preferences, dailyMinutes: 120, maxTasks: 4 }, referenceDate: "2026-10-10" })
    expect(result.tasks.map((t) => t.topicId)).toEqual(topics.map((t) => t.id))
    expect(new Set(result.tasks.map((t) => t.topicId)).size).toBe(result.tasks.length)
  })

  it("does not exceed the task limit by adding a prerequisite chain", () => {
    const topics = [catTopics[0], catTopics[1], catTopics[4]]
    const result = generateStudyQueue({ topics, progressByTopic: progressFor([{ topicId: topics[2].id, status: "needs_revision", reviewDueOn: "2026-10-01" }]), preferences: { ...preferences, dailyMinutes: 120, maxTasks: 1 }, referenceDate: "2026-10-10" })
    expect(result.tasks.map((t) => t.topicId)).toEqual([topics[0].id])
  })

  it("charges retained completion and in-progress blocks against regeneration capacity", () => {
    const result = generateStudyQueue({ topics: [catTopics[0], catTopics[5]], progressByTopic: new Map(), preferences, referenceDate: "2026-10-10", existingTasks: [
      { topicId: catTopics[0].id, position: 1, plannedMinutes: 35, status: "completed" },
    ] })
    expect(result.totalMinutes).toBe(60)
    expect(result.tasks).toEqual([expect.objectContaining({ topicId: catTopics[5].id, position: 2, plannedMinutes: 25 })])
  })

  it("retains skips without charging their minutes or rescheduling the topic", () => {
    const result = generateStudyQueue({ topics: [catTopics[0], catTopics[5]], progressByTopic: new Map(), preferences, referenceDate: "2026-10-10", existingTasks: [
      { topicId: catTopics[0].id, position: 1, plannedMinutes: 35, status: "skipped" },
    ] })
    expect(result.totalMinutes).toBe(25)
    expect(result.tasks[0].topicId).toBe(catTopics[5].id)
  })

  it("rejects a budget below already committed work", () => {
    expect(() => generateStudyQueue({ topics: catTopics, progressByTopic: new Map(), preferences: { ...preferences, dailyMinutes: 30 }, referenceDate: "2026-10-10", existingTasks: [{ topicId: catTopics[0].id, position: 1, plannedMinutes: 35, status: "in_progress" }] })).toThrow("below work already")
  })

  it("is independent of database row order", () => {
    const input = { topics: catTopics, progressByTopic: new Map(), preferences, referenceDate: "2026-10-10" }
    expect(generateStudyQueue({ ...input, topics: [...catTopics].reverse() })).toEqual(generateStudyQueue(input))
  })

  it("rejects cyclic or missing prerequisite definitions", () => {
    const topic = { ...catTopics[0], prerequisiteIds: [catTopics[0].id] }
    expect(() => generateStudyQueue({ topics: [topic], progressByTopic: new Map(), preferences, referenceDate: "2026-10-10" })).toThrow("Cyclic")
    expect(() => generateStudyQueue({ topics: [{ ...topic, prerequisiteIds: ["missing"] }], progressByTopic: new Map(), preferences, referenceDate: "2026-10-10" })).toThrow("Missing prerequisite")
  })
})
