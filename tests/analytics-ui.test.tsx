import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { PerformanceDashboard } from "@/components/analytics/performance-dashboard"
import { createPerformanceAnalytics, type RawPerformanceAnalytics } from "@/lib/analytics"
import { catSections, catTopics } from "@/lib/cat-syllabus"

afterEach(cleanup)
const raw: RawPerformanceAnalytics = { windowDays: 90, windowStartedAt: "2026-01-01T00:00:00Z", startedAttempts: 1, finalizedAttempts: 1, activeAttempts: 0, completionRate: 100,
  overall: { attempts: 1, totalQuestions: 2, answeredQuestions: 1, correct: 0, incorrect: 1, unanswered: 1, skipped: 1, accuracy: 0 }, sections: [{ section: "QA", attempts: 1, totalQuestions: 2, answeredQuestions: 1, correct: 0, incorrect: 1, unanswered: 1, skipped: 1, accuracy: 0 }],
  topics: [{ topicId: catTopics[0].id, topicTitle: catTopics[0].title, section: "VARC", attempts: 1, totalQuestions: 2, answeredQuestions: 1, correct: 0, incorrect: 1, unanswered: 1, skipped: 1, accuracy: 0, lastPractisedAt: "2026-02-01T00:00:00Z", incorrectAttempts: 1, recentAnsweredQuestions: 1, recentCorrect: 0, recentAccuracy: 0 }], scoreHistory: [], recentTrend: [], timing: { attemptsWithTiming: 1, totalElapsedSeconds: 120, averageElapsedSeconds: 120, averageSecondsPerQuestion: 60 } }

describe("performance dashboard", () => {
  it("shows real empty/evidence labels and filters topics by section", async () => {
    const user = userEvent.setup()
    const data = createPerformanceAnalytics(raw, catTopics.slice(0, 2), catSections)
    render(<PerformanceDashboard data={data} />)
    expect(screen.getByRole("heading", { name: "Know what the work is showing." })).toBeInTheDocument()
    expect(screen.getByText("Limited evidence")).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: "Section" }), "QA")
    expect(screen.queryByText(catTopics[0].title)).not.toBeInTheDocument()
  })
  it("offers practice and mistake actions from evidence-based recommendations", () => {
    const data = createPerformanceAnalytics(raw, catTopics.slice(0, 2), catSections)
    render(<PerformanceDashboard data={data} />)
    expect(screen.getAllByRole("link", { name: "Practise" }).some((link) => link.getAttribute("href") === `/dashboard/practice?topicId=${catTopics[0].id}`)).toBe(true)
    expect(screen.getAllByRole("link", { name: "Syllabus" }).some((link) => link.getAttribute("href") === `/dashboard/syllabus#${catTopics[0].id}`)).toBe(true)
  })
})
