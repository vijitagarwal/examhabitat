import { describe, expect, it } from "vitest"
import { classifyAnswer, normalizeNumeric, PRACTICE_POLICY, questionSchema, remainingSeconds, scoreAnswers, startPracticeSchema } from "@/lib/practice"

describe("practice scoring and input boundaries", () => {
  it.each([[" +00012.34000 ", "12.34"], ["-00.000", "0"], ["-12.5", "-12.5"], ["0.300000", "0.3"]])("normalizes %s exactly", (input, expected) => expect(normalizeNumeric(input)).toBe(expected))
  it.each(["1/2", "1e3", "1,000", ".5", "1.", "NaN", "Infinity", "1.0000001", "1234567890123", ""]) ("rejects ambiguous numeric input %s", (value) => expect(normalizeNumeric(value)).toBeNull())
  it("uses MCQ-only negative marking and counts skips as unanswered", () => {
    const result = scoreAnswers([
      { section: "QA", type: "mcq", key: "A", answer: "A", skipped: false },
      { section: "VARC", type: "mcq", key: "B", answer: "D", skipped: false },
      { section: "QA", type: "numeric", key: "3", answer: "2", skipped: false },
      { section: "DILR", type: "numeric", key: "3", answer: null, skipped: true },
      { section: "QA", type: "mcq", key: "A", answer: null, skipped: false },
    ], PRACTICE_POLICY)
    expect(result).toMatchObject({ score: 2, correct: 1, incorrect: 2, attempted: 3, accuracy: 33.33, unanswered: 2, skipped: 1, maxScore: 15 })
    expect(result.outcomes).toEqual(["correct", "incorrect", "incorrect", "skipped", "unanswered"])
  })
  it("supports no-negative policy and exact equivalent decimals", () => {
    expect(classifyAnswer("numeric", "0.3", " +00.3000 ", false)).toBe("correct")
    expect(scoreAnswers([{ section: "QA", type: "mcq", key: "A", answer: "B", skipped: false }], { ...PRACTICE_POLICY, mcqPenalty: 0 }).score).toBe(0)
    expect(() => classifyAnswer("numeric", "1", "1e0", false)).toThrow()
    expect(() => classifyAnswer("mcq", "A", "E", false)).toThrow()
  })
  it("returns unassessed accuracy for zero attempted questions", () => {
    expect(scoreAnswers([], PRACTICE_POLICY)).toMatchObject({ score: 0, accuracy: null, total: 0 })
  })
  it("derives time from a saved deadline and server clock including sleep", () => {
    expect(remainingSeconds("2026-10-10T01:01:00Z", "2026-10-10T01:00:00Z", 30000)).toBe(30)
    expect(remainingSeconds("2026-10-10T01:01:00Z", "2026-10-10T01:00:00Z", 120000)).toBe(0)
    expect(remainingSeconds("2026-10-10T01:00:00Z", "2026-10-10T01:00:00Z")).toBe(0)
    expect(remainingSeconds(null, "2026-10-10T01:00:00Z")).toBeNull()
  })
  it("rejects missing setup and forged ownership", () => {
    expect(startPracticeSchema.safeParse({}).success).toBe(false)
    expect(startPracticeSchema.safeParse({ requestId: crypto.randomUUID(), filters: {}, mode: "practice", minutes: 10, count: 3, policy: "standard", userId: "forged" }).success).toBe(false)
  })
  it("rejects duplicate options and mismatched passages", () => {
    const q = { id: "q", version: 1, section: "QA", topicId: "topic", topicTitle: "Topic", difficulty: 1, type: "mcq", prompt: "A complete question?", options: ["A", "B", "C", "D"].map((id) => ({ id, text: id })), stimulus: null, provenance: "original-practice" }
    expect(questionSchema.safeParse(q).success).toBe(true)
    expect(questionSchema.safeParse({ ...q, options: [q.options[0], q.options[0]] }).success).toBe(false)
    expect(questionSchema.safeParse({ ...q, stimulus: { id: "passage", kind: "passage", title: "Title", body: "Text", columns: [], rows: [] } }).success).toBe(false)
  })
})
