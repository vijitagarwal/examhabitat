import { describe, expect, it } from "vitest"
import { addDays, dateSchema, formatDateInTimeZone, isDateDue } from "@/lib/dates"
import { studyPreferencesSchema } from "@/lib/progress"

describe("calendar boundaries and preferences", () => {
  it("uses the saved time zone at midnight boundaries", () => {
    const date = new Date("2026-10-10T18:45:00Z")
    expect(formatDateInTimeZone(date, "Asia/Kolkata")).toBe("2026-10-11")
    expect(formatDateInTimeZone(date, "America/New_York")).toBe("2026-10-10")
  })
  it("adds calendar days independent of DST or machine locale", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
  })
  it("rejects impossible dates", () => {
    expect(dateSchema.safeParse("2026-02-29").success).toBe(false)
    expect(dateSchema.safeParse("2026-13-01").success).toBe(false)
    expect(dateSchema.safeParse("2028-02-29").success).toBe(true)
  })
  it("treats today as due without inventing a due date", () => {
    expect(isDateDue("2026-10-10", "2026-10-10")).toBe(true)
    expect(isDateDue(null, "2026-10-10")).toBe(false)
  })
  it.each([
    {}, { dailyMinutes: 0, maxTasks: 3, timezone: "UTC", targetDate: null },
    { dailyMinutes: 60, maxTasks: 13, timezone: "UTC", targetDate: null },
    { dailyMinutes: 60, maxTasks: 3, timezone: "invalid/zone", targetDate: null },
    { dailyMinutes: "60", maxTasks: 3, timezone: "UTC", targetDate: null },
  ])("rejects incomplete or invalid preferences %#", (input) => {
    expect(studyPreferencesSchema.safeParse(input).success).toBe(false)
  })
})
