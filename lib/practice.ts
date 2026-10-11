import { z } from "zod"

export const sectionSchema = z.enum(["VARC", "DILR", "QA"])
export const answerTypeSchema = z.enum(["mcq", "numeric"])
// No exponents, fractions, commas or implicit rounding. Up to 12 integer / 6 fractional digits.
export const numericPattern = /^[+-]?\d{1,12}(\.\d{1,6})?$/
export function normalizeNumeric(value: string): string | null {
  const text = value.trim()
  if (!numericPattern.test(text)) return null
  const negative = text.startsWith("-")
  const [whole, decimal = ""] = text.replace(/^[+-]/, "").split(".")
  const integer = whole.replace(/^0+(?=\d)/, "")
  const fraction = decimal.replace(/0+$/, "")
  const zero = integer === "0" && !fraction
  return `${negative && !zero ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`
}
export const stimulusSchema = z.object({
  id: z.string(), kind: z.enum(["passage", "case"]), title: z.string().min(1), body: z.string().min(1),
  columns: z.array(z.string()), rows: z.array(z.array(z.string())),
}).refine((s) => s.rows.every((row) => row.length === s.columns.length), "Table rows must match the columns.")
export const questionSchema = z.object({
  id: z.string(), version: z.number().int().positive(), section: sectionSchema, topicId: z.string(), topicTitle: z.string(),
  difficulty: z.number().int().min(1).max(3), type: answerTypeSchema, prompt: z.string().min(10),
  options: z.array(z.object({ id: z.enum(["A", "B", "C", "D"]), text: z.string().min(1) })),
  stimulus: stimulusSchema.nullable(), provenance: z.literal("original-practice"),
}).superRefine((q, ctx) => {
  if (q.type === "mcq" && (q.options.length !== 4 || new Set(q.options.map((o) => o.id)).size !== 4)) ctx.addIssue({ code: "custom", message: "MCQ needs four distinct options." })
  if (q.type === "numeric" && q.options.length) ctx.addIssue({ code: "custom", message: "Numeric questions cannot have options." })
  if (q.stimulus && ((q.stimulus.kind === "passage" && q.section !== "VARC") || (q.stimulus.kind === "case" && q.section !== "DILR"))) ctx.addIssue({ code: "custom", message: "Shared content does not match this section." })
})
export type PracticeQuestion = z.infer<typeof questionSchema>
export const policySchema = z.object({ version: z.literal("practice-v1"), correct: z.literal(3), mcqPenalty: z.union([z.literal(0), z.literal(1)]), numericPenalty: z.literal(0) })
export type ScoringPolicy = z.infer<typeof policySchema>
export const PRACTICE_POLICY: ScoringPolicy = { version: "practice-v1", correct: 3, mcqPenalty: 1, numericPenalty: 0 }
export const outcomeSchema = z.enum(["correct", "incorrect", "unanswered", "skipped"])
export type Outcome = z.infer<typeof outcomeSchema>
export function classifyAnswer(type: "mcq" | "numeric", key: string, answer: string | null, skipped: boolean): Outcome {
  if (skipped) return "skipped"
  if (answer === null || answer.trim() === "") return "unanswered"
  if (type === "numeric") {
    const actual = normalizeNumeric(answer)
    const expected = normalizeNumeric(key)
    if (actual === null || expected === null) throw new Error("Invalid numeric answer or key")
    return actual === expected ? "correct" : "incorrect"
  }
  if (!/^[A-D]$/.test(answer) || !/^[A-D]$/.test(key)) throw new Error("Invalid option")
  return answer === key ? "correct" : "incorrect"
}
export type ScoringItem = { section: "VARC" | "DILR" | "QA"; type: "mcq" | "numeric"; key: string; answer: string | null; skipped: boolean }
export function scoreAnswers(items: ScoringItem[], policy: ScoringPolicy) {
  policySchema.parse(policy)
  let score = 0, correct = 0, incorrect = 0, skipped = 0, unanswered = 0
  const outcomes = items.map((item) => {
    const outcome = classifyAnswer(item.type, item.key, item.answer, item.skipped)
    if (outcome === "correct") { correct++; score += policy.correct }
    else if (outcome === "incorrect") { incorrect++; score -= item.type === "mcq" ? policy.mcqPenalty : policy.numericPenalty }
    else { unanswered++; if (outcome === "skipped") skipped++ }
    return outcome
  })
  const attempted = correct + incorrect
  return { score, correct, incorrect, unanswered, skipped, attempted, total: items.length, maxScore: items.length * policy.correct,
    accuracy: attempted ? Math.round(correct / attempted * 10000) / 100 : null, outcomes }
}
export function remainingSeconds(deadline: string | null, serverNow: string, elapsedMs = 0) {
  return deadline === null ? null : Math.max(0, Math.ceil((Date.parse(deadline) - Date.parse(serverNow) - elapsedMs) / 1000))
}
export const bankFilterSchema = z.object({
  search: z.string().trim().max(100).default(""), section: z.union([sectionSchema, z.literal("")]).default(""),
  topicId: z.string().max(100).default(""), difficulty: z.number().int().min(0).max(3).default(0),
  type: z.union([answerTypeSchema, z.literal("")]).default(""), history: z.enum(["all", "attempted", "unattempted", "bookmarked"]).default("all"),
}).strict()
export type BankFilter = z.infer<typeof bankFilterSchema>
export const startPracticeSchema = z.object({ requestId: z.string().uuid(), filters: bankFilterSchema, questionIds: z.array(z.string().max(100)).max(20).default([]),
  count: z.number().int().min(1).max(20), mode: z.enum(["practice", "timed"]), minutes: z.number().int().min(1).max(120),
  policy: z.enum(["standard", "no-negative"]),
}).strict().refine((v) => new Set(v.questionIds).size === v.questionIds.length, "Duplicate question IDs.")
export const answerInputSchema = z.object({ questionId: z.string(), answer: z.string().trim().max(32).nullable(), skipped: z.boolean() }).strict()
  .refine((v) => !v.skipped || v.answer === null, "A skipped question cannot have an answer.")
export const attemptCommandSchema = z.object({ attemptId: z.string().uuid(), requestId: z.string().uuid(), revision: z.number().int().nonnegative(),
  operation: z.enum(["save", "submit"]), answer: answerInputSchema.nullable(),
}).strict().refine((v) => v.operation !== "save" || v.answer !== null, "Missing answer.")
const countsSchema = z.object({ score: z.number(), correct: z.number(), incorrect: z.number(), unanswered: z.number(), skipped: z.number(), attempted: z.number(), total: z.number(), maxScore: z.number(), accuracy: z.number().nullable() })
export const resultSchema = countsSchema.extend({ sections: z.array(countsSchema.extend({ section: sectionSchema })), elapsedSeconds: z.number().nonnegative() })
export const attemptItemSchema = z.object({ question: questionSchema, position: z.number(), answer: z.string().nullable(), skipped: z.boolean(), bookmarked: z.boolean(),
  outcome: outcomeSchema.nullable(), key: z.string().nullable(), explanation: z.string().nullable(), reviewed: z.boolean(),
})
export const attemptSchema = z.object({ id: z.string().uuid(), status: z.enum(["active", "submitted", "expired"]), mode: z.enum(["practice", "timed"]), revision: z.number(),
  startedAt: z.string(), deadline: z.string().nullable(), finishedAt: z.string().nullable(), serverNow: z.string(), policy: policySchema,
  result: resultSchema.nullable(), items: z.array(attemptItemSchema).min(1).max(20),
}).superRefine((attempt, ctx) => {
  if (attempt.status === "active" && (attempt.result !== null || attempt.items.some((i) => i.key !== null || i.explanation !== null || i.outcome !== null))) ctx.addIssue({ code: "custom", message: "Active attempt contains a result." })
})
export type PracticeAttempt = z.infer<typeof attemptSchema>
export const bankSchema = z.object({ total: z.number(), questions: z.array(z.object({ question: questionSchema, attempted: z.boolean(), bookmarked: z.boolean() })) })
export const historySchema = z.object({ total: z.number(), attempts: z.array(z.object({ id: z.string().uuid(), mode: z.enum(["practice", "timed"]), status: z.enum(["active", "submitted", "expired"]), startedAt: z.string(), deadline: z.string().nullable(), count: z.number(), result: resultSchema.nullable() })) })
export const mistakesSchema = z.object({ total: z.number(), mistakes: z.array(z.object({ attemptId: z.string().uuid(), questionId: z.string(), prompt: z.string(), topicTitle: z.string(), section: sectionSchema, outcome: outcomeSchema, reviewed: z.boolean(), finishedAt: z.string() })) })
export const practiceSignalSchema = z.object({ topicId: z.string(), attempted: z.number().int(), incorrect: z.number().int() })
export type PracticeSignal = z.infer<typeof practiceSignalSchema>
export function needsPractice(signal: PracticeSignal | undefined) { return Boolean(signal && signal.attempted >= 3 && signal.incorrect / signal.attempted >= 0.5) }
