import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { WorkspaceClient } from "@/components/workspace/workspace-client"
import { DashboardOverview } from "@/components/workspace/dashboard-overview"
import { WorkspaceState } from "@/components/workspace/workspace-state"
import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { generateAndSaveStudyPlan, saveStudyPreferences, saveTopicProgress, updateStudyTaskStatus } from "@/app/dashboard/actions"
import { emptyTopicProgress } from "@/lib/progress"
import { catTopics } from "@/lib/cat-syllabus"
import type { ActionResult, CatWorkspaceData } from "@/lib/workspace"
import { planFixture, workspaceFixture } from "./fixtures"

vi.mock("@/app/dashboard/actions", () => ({ generateAndSaveStudyPlan: vi.fn(), saveStudyPreferences: vi.fn(), saveTopicProgress: vi.fn(), updateStudyTaskStatus: vi.fn() }))
vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }))
beforeEach(() => { vi.resetAllMocks() })
afterEach(cleanup)

describe("syllabus workflow", () => {
  it("composes search, section and status filters and restores them when cleared", async () => {
    const user = userEvent.setup()
    render(<WorkspaceClient initialData={workspaceFixture()} view="syllabus" />)
    expect(screen.getByRole("heading", { name: "Quantitative Aptitude" })).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox", { name: "Search topics" }), "percentages")
    expect(screen.getByRole("link", { name: /Percentages/ })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: "Section" }), "cat-varc")
    expect(screen.getByText("No matching topics")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await user.selectOptions(screen.getByRole("combobox", { name: "Learning state" }), "mastered")
    expect(screen.getByText("No matching topics")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(screen.getByRole("link", { name: /Main idea and purpose/ })).toBeInTheDocument()
  })

  it("saves status and confidence, then shows the returned persisted values", async () => {
    const user = userEvent.setup()
    const updated = workspaceFixture({ revision: 1, progress: [{ ...emptyTopicProgress(catTopics[0].id), status: "learning", confidence: 4, accumulatedMinutes: 25, lastStudiedAt: "2026-10-10T04:00:00Z", reviewDueOn: "2026-10-14" }] })
    vi.mocked(saveTopicProgress).mockResolvedValue({ ok: true, data: updated })
    render(<WorkspaceClient initialData={workspaceFixture()} view="syllabus" />)
    await user.click(screen.getByRole("link", { name: /Main idea and purpose/ }))
    await user.selectOptions(screen.getByRole("combobox", { name: "Learning status" }), "learning")
    await user.selectOptions(screen.getByRole("combobox", { name: "Confidence · 1 low, 5 high" }), "4")
    await user.clear(screen.getByRole("spinbutton", { name: "Add study minutes" }))
    await user.type(screen.getByRole("spinbutton", { name: "Add study minutes" }), "25")
    await user.click(screen.getByRole("button", { name: "Save progress" }))
    expect(await screen.findByText("Progress saved to your account.")).toBeInTheDocument()
    expect(screen.getByText("25 minutes")).toBeInTheDocument()
    expect(saveTopicProgress).toHaveBeenCalledWith(expect.objectContaining({ requestId: expect.any(String), expectedRevision: 0, payload: expect.objectContaining({ status: "learning", confidence: 4, minutesStudied: 25 }) }))
    expect(screen.getByRole("spinbutton", { name: "Add study minutes" })).toHaveValue(0)
  })

  it("preserves failed edits, avoids false success, and retries with the same request ID", async () => {
    const user = userEvent.setup()
    vi.mocked(saveTopicProgress).mockResolvedValue({ ok: false, code: "database", message: "Could not save. Please retry." })
    render(<WorkspaceClient initialData={workspaceFixture()} view="syllabus" />)
    await user.click(screen.getByRole("link", { name: /Main idea and purpose/ }))
    await user.selectOptions(screen.getByRole("combobox", { name: "Learning status" }), "learning")
    await user.click(screen.getByRole("button", { name: "Save progress" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save")
    expect(screen.getByRole("combobox", { name: "Learning status" })).toHaveValue("learning")
    expect(screen.getByRole("link", { name: /Main idea and purpose/ })).toHaveTextContent("Not started")
    expect(screen.queryByText("Progress saved to your account.")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save progress" }))
    expect(vi.mocked(saveTopicProgress).mock.calls[1][0]).toEqual(vi.mocked(saveTopicProgress).mock.calls[0][0])
  })

  it("prevents duplicate submissions while a save is pending", async () => {
    const user = userEvent.setup()
    let finish: (value: ActionResult<CatWorkspaceData>) => void = () => undefined
    vi.mocked(saveTopicProgress).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    render(<WorkspaceClient initialData={workspaceFixture()} view="syllabus" />)
    await user.click(screen.getByRole("link", { name: /Main idea and purpose/ }))
    await user.click(screen.getByRole("button", { name: "Save progress" }))
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Saving…" }))
    expect(saveTopicProgress).toHaveBeenCalledTimes(1)
    finish({ ok: false, code: "database", message: "Retry later" })
    expect(await screen.findByRole("alert")).toHaveTextContent("Retry later")
  })
})

describe("planning and empty-account UI", () => {
  it("generates a saved plan and explicitly completes a task without inventing mastery", async () => {
    const user = userEvent.setup()
    const plan = planFixture()
    vi.mocked(generateAndSaveStudyPlan).mockResolvedValue({ ok: true, data: workspaceFixture({ revision: 1, plans: [plan] }) })
    vi.mocked(updateStudyTaskStatus).mockResolvedValue({ ok: true, data: workspaceFixture({ revision: 2, plans: [{ ...plan, tasks: [{ ...plan.tasks[0], status: "completed", completedAt: "2026-10-10T05:00:00Z" }] }] }) })
    render(<WorkspaceClient initialData={workspaceFixture()} view="plan" />)
    expect(screen.getByText("No plan saved for today")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Generate today’s queue" }))
    expect(await screen.findByRole("heading", { name: "Main idea and purpose" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Complete block" }))
    expect(await screen.findByText("Task status saved.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Complete block" })).not.toBeInTheDocument()
    expect(screen.getByText(/35 completed block minutes/)).toBeInTheDocument()
    expect(saveTopicProgress).not.toHaveBeenCalled()
  })
  it("saves preferences and reports a failed plan without showing invented tasks", async () => {
    const user = userEvent.setup()
    vi.mocked(saveStudyPreferences).mockResolvedValue({ ok: true, data: workspaceFixture({ revision: 1 }) })
    vi.mocked(generateAndSaveStudyPlan).mockResolvedValue({ ok: false, code: "database", message: "Could not save the plan." })
    render(<WorkspaceClient initialData={workspaceFixture()} view="plan" />)
    await user.click(screen.getByRole("button", { name: "Save preferences" }))
    expect(await screen.findByText(/Planning preferences saved/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Generate today’s queue" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the plan.")
    expect(screen.getByText("No plan saved for today")).toBeInTheDocument()
  })
  it("renders a genuine new account without mock activity", () => {
    render(<DashboardOverview data={workspaceFixture()} />)
    expect(screen.getByText("Not assessed")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "No plan generated yet" })).toBeInTheDocument()
    for (const bar of screen.getAllByRole("progressbar")) expect(bar).toHaveAttribute("aria-valuenow", "0")
  })
  it("offers sign-in when the session is missing", () => {
    render(<WorkspaceState kind="unauthenticated" message="Sign in to continue" />)
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/auth")
  })
  it("opens real mobile navigation with an accessible disclosure", async () => {
    const user = userEvent.setup()
    render(<WorkspaceFrame activePath="/dashboard">Workspace content</WorkspaceFrame>)
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    const navigation = document.getElementById("mobile-navigation")!
    expect(navigation).not.toHaveAttribute("hidden")
    expect(within(navigation).getByRole("link", { name: "Syllabus" })).toHaveAttribute("href", "/dashboard/syllabus")
    await user.click(screen.getByRole("button", { name: "Close navigation" }))
    expect(navigation).toHaveAttribute("hidden")
  })
})
