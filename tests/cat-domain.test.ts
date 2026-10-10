import { describe, expect, it } from "vitest"
import { CAT_CATALOG_ID, catSections, catSyllabusCatalog, catTopicGroups, catTopics } from "@/lib/cat-syllabus"
import { aggregateProgress, canTransitionTopicStatus, emptyTopicProgress, getReviewDueOn, getProgressWeight, topicProgressInputSchema, topicStatusSchema } from "@/lib/progress"

describe("CAT syllabus catalog", () => {
  it("uses stable unique topic IDs across all supported sections", () => {
    const ids = catTopics.map((topic) => topic.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(catSyllabusCatalog.id).toBe(CAT_CATALOG_ID)
    expect(catSections.map((section) => section.code)).toEqual(["VARC", "DILR", "QA"])
    expect(catTopics.every((topic) => topic.catalogId === CAT_CATALOG_ID)).toBe(true)
    expect(catTopics.every((topic) => catSections.some((section) => section.id === topic.sectionId))).toBe(true)
    expect(catTopics.every((topic) => catTopicGroups.some((group) => group.id === topic.groupId))).toBe(true)
  })

  it("keeps prerequisites within the catalog", () => {
    const topicIds = new Set(catTopics.map((topic) => topic.id))
    expect(catTopics.every((topic) => topic.prerequisiteIds.every((id) => topicIds.has(id)))).toBe(true)
  })
})

describe("topic progress domain", () => {
  it("validates state and bounded numeric inputs", () => {
    expect(topicStatusSchema.safeParse("practising").success).toBe(true)
    expect(topicStatusSchema.safeParse("done").success).toBe(false)
    expect(topicProgressInputSchema.safeParse({ topicId: "topic", status: "learning", confidence: 5, priority: 1, minutesStudied: 0 }).success).toBe(true)
    expect(topicProgressInputSchema.safeParse({ topicId: "topic", status: "learning", confidence: 6, priority: 1, minutesStudied: 0 }).success).toBe(false)
    expect(topicProgressInputSchema.safeParse({ topicId: "topic", status: "learning", confidence: 2, priority: 1, minutesStudied: -1 }).success).toBe(false)
  })

  it("allows only deliberate learning-state transitions", () => {
    expect(canTransitionTopicStatus("not_started", "learning")).toBe(true)
    expect(canTransitionTopicStatus("not_started", "mastered")).toBe(false)
    expect(canTransitionTopicStatus("learning", "practising")).toBe(true)
    expect(canTransitionTopicStatus("mastered", "needs_revision")).toBe(true)
  })

  it("schedules review dates without treating mastery as permanent", () => {
    expect(getReviewDueOn("not_started", 1, "2026-10-10")).toBeNull()
    expect(getReviewDueOn("needs_revision", 1, "2026-10-10")).toBe("2026-10-12")
    expect(getReviewDueOn("mastered", 2, "2026-10-10")).toBe("2026-10-17")
  })

  it("aggregates empty and active progress without undefined metrics", () => {
    const topics = catTopics.slice(0, 3)
    const progress = new Map(topics.map((topic) => [topic.id, emptyTopicProgress(topic.id)]))
    expect(aggregateProgress(topics, progress)).toMatchObject({ totalTopics: 3, progressPercent: 0, averageConfidence: 0, masteredTopics: 0 })
    expect(aggregateProgress([], new Map())).toMatchObject({ totalTopics: 0, progressPercent: 0, averageConfidence: 0 })
    progress.set(topics[0].id, { ...emptyTopicProgress(topics[0].id), status: "mastered", confidence: 4 })
    expect(aggregateProgress(topics, progress).progressPercent).toBeGreaterThan(0)
    expect(getProgressWeight("mastered", 4)).toBeLessThanOrEqual(1)
  })
})
