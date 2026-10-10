import { describe, expect, it } from "vitest"
import { examCodeSchema, examDefinitions, getExamDefinition } from "@/lib/exams"

describe("exam catalog", () => {
  it("enables only the validated CAT vertical slice", () => {
    expect(examDefinitions.filter((exam) => exam.enabled).map((exam) => exam.code)).toEqual(["cat"])
  })

  it("does not silently fall back for invalid values", () => {
    expect(getExamDefinition("unknown")).toBeUndefined()
    expect(examCodeSchema.safeParse("unknown").success).toBe(false)
  })
})
