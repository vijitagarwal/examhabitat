import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ActiveSession } from "@/components/practice/active-session"
import { QuestionBank } from "@/components/practice/question-bank"
import { AttemptResults } from "@/components/practice/attempt-results"
import { browseQuestions, markQuestion, refreshSession, saveSession, startSession } from "@/app/dashboard/practice/actions"
import type { PracticeAttempt, PracticeQuestion } from "@/lib/practice"

vi.mock("@/app/dashboard/practice/actions", () => ({ browseQuestions: vi.fn(), markQuestion: vi.fn(), refreshSession: vi.fn(), saveSession: vi.fn(), startSession: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
afterEach(cleanup)
beforeEach(() => { vi.resetAllMocks(); vi.mocked(markQuestion).mockResolvedValue({ ok: true, data: true }); vi.mocked(refreshSession).mockResolvedValue({ ok: true, data: attempt }); vi.mocked(saveSession).mockResolvedValue({ ok: true, data: submitted }) })

const question: PracticeQuestion = { id: "cat-p-017", version: 1, section: "QA", topicId: "cat-qa-arithmetic-percentages", topicTitle: "Percentages", difficulty: 1,
  type: "numeric", prompt: "A price of 1200 is increased by 20% and then discounted by 25%. What is the final price?", options: [], stimulus: null, provenance: "original-practice" }
const questionTwo: PracticeQuestion = { ...question, id: "cat-p-018", topicId: "cat-qa-arithmetic-ratios", topicTitle: "Ratios and proportions", type: "mcq", prompt: "A and B divide 64 tokens in the ratio 3:5. How many tokens does B receive?", options: [{ id: "A", text: "24" }, { id: "B", text: "32" }, { id: "C", text: "40" }, { id: "D", text: "48" }] }
const item = (q: PracticeQuestion = question, position = 1) => ({ question: q, position, answer: null, skipped: false, bookmarked: false, outcome: null, key: null, explanation: null, reviewed: false })
const attempt: PracticeAttempt = { id: "00000000-0000-4000-8000-000000000001", status: "active", mode: "practice", revision: 0, startedAt: "2026-10-10T01:00:00Z", deadline: null, finishedAt: null, serverNow: "2026-10-10T01:00:00Z", policy: { version: "practice-v1", correct: 3, mcqPenalty: 1, numericPenalty: 0 }, result: null, items: [item(), item(questionTwo, 2)] }
const submitted: PracticeAttempt = { ...attempt, status: "submitted", revision: 2, finishedAt: "2026-10-10T01:02:00Z", result: { score: 3, correct: 1, incorrect: 0, unanswered: 1, skipped: 0, attempted: 1, total: 2, maxScore: 6, accuracy: 100, elapsedSeconds: 120, sections: [{ section: "QA", score: 3, correct: 1, incorrect: 0, unanswered: 1, skipped: 0, attempted: 1, total: 2, maxScore: 6, accuracy: 100 }] }, items: [{ ...item(), answer: "1080", key: "1080", explanation: "The price is 1200 × 1.2 × .75 = 1080.", outcome: "correct" }, { ...item(questionTwo, 2), key: "C", explanation: "There are eight ratio units; B receives five, or 40.", outcome: "unanswered" }] }

describe("practice UI workflows", () => {
  it("filters the bank and starts an explicitly configured session", async () => {
    const user = userEvent.setup()
    vi.mocked(startSession).mockResolvedValue({ ok: true, data: attempt })
    render(<QuestionBank initial={{ total: 1, questions: [{ question, attempted: false, bookmarked: false }] }} initialFilters={{ search: "", section: "", topicId: "", difficulty: 0, type: "", history: "all" }} topics={[{ id: question.topicId, title: question.topicTitle, section: "QA" }]} />)
    expect(screen.getByRole("heading", { name: /Practise with a purpose/ })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: "Answer type" }), "numeric")
    await user.click(screen.getByRole("button", { name: "Apply filters" }))
    expect(browseQuestions).toHaveBeenCalledWith({ filters: expect.objectContaining({ type: "numeric" }), page: 0 })
    await user.click(screen.getByRole("button", { name: "Start session" }))
    expect(startSession).toHaveBeenCalledWith(expect.objectContaining({ mode: "practice", count: 10, policy: "standard", requestId: expect.any(String) }))
  })
  it("changes an answer, saves it and submits without trusting client results", async () => {
    const user = userEvent.setup()
    const saved: PracticeAttempt = { ...attempt, revision: 1, items: [{ ...item(), answer: "1080" }, item(questionTwo, 2)] }
    vi.mocked(saveSession).mockResolvedValueOnce({ ok: true, data: saved }).mockResolvedValueOnce({ ok: true, data: submitted })
    render(<ActiveSession initial={attempt} />)
    await user.type(screen.getByRole("textbox", { name: "Numeric answer" }), "1080")
    await user.click(screen.getByRole("button", { name: "Save answer" }))
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ operation: "save", answer: { answer: "1080", skipped: false, questionId: question.id } }))
    await user.click(screen.getByRole("button", { name: "Submit attempt" }))
    await user.click(screen.getByRole("button", { name: "Confirm submission" }))
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ operation: "submit" }))
    expect(await screen.findByRole("heading", { name: "Your practice result" })).toBeInTheDocument()
    expect(screen.getByText("3 / 6 points")).toBeInTheDocument()
  })
  it("does not show answer keys before submission and displays explanation afterward", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ActiveSession initial={attempt} />)
    expect(screen.queryByText("The price is 1200 × 1.2 × .75 = 1080.")).not.toBeInTheDocument()
    rerender(<AttemptResults attempt={submitted} />)
    expect(screen.getByText("The price is 1200 × 1.2 × .75 = 1080.")).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: "Review filter" }), "unanswered")
    expect(screen.getByText("Question 2 · unanswered")).toBeInTheDocument()
    expect(screen.queryByText("Question 1 · correct")).not.toBeInTheDocument()
  })
  it("keeps failed saves visible and does not show false completion", async () => {
    const user = userEvent.setup()
    vi.mocked(saveSession).mockResolvedValue({ ok: false, code: "database", message: "Save was not confirmed." })
    render(<ActiveSession initial={attempt} />)
    await user.type(screen.getByRole("textbox", { name: "Numeric answer" }), "1080")
    await user.click(screen.getByRole("button", { name: "Save answer" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Save was not confirmed")
    expect(screen.queryByText("Answer saved to your account.")).not.toBeInTheDocument()
  })
})
