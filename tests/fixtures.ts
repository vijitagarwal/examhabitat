import { catSyllabusCatalog } from "@/lib/cat-syllabus"
import { DEFAULT_STUDY_PREFERENCES } from "@/lib/progress"
import { enrichWorkspace, type WorkspaceSnapshot, type WorkspacePlan } from "@/lib/workspace"

export function workspaceFixture(overrides: Partial<WorkspaceSnapshot> = {}) {
  return enrichWorkspace({ revision: 0, today: "2026-10-10", preferences: DEFAULT_STUDY_PREFERENCES,
    catalog: catSyllabusCatalog, progress: [], plans: [], ...overrides })
}
export function planFixture(): WorkspacePlan {
  return {
    id: "00000000-0000-4000-8000-000000000011", planDate: "2026-10-10", algorithmVersion: "cat-planner-v1", status: "active",
    totalMinutes: 35, dailyBudget: 60, taskLimit: 3, generatedAt: "2026-10-10T04:00:00Z",
    tasks: [{ id: "00000000-0000-4000-8000-000000000012", topicId: catSyllabusCatalog.topics[0].id, position: 1, plannedMinutes: 35,
      reason: "Untouched foundation; start with a focused first pass.", status: "planned", completedAt: null, skippedAt: null }],
  }
}
