import { z } from "zod"
import { dateSchema } from "@/lib/dates"
import { aggregateProgress, progressSchema, studyPreferencesSchema } from "@/lib/progress"

const topicSchema = z.object({
  id: z.string(), catalogId: z.string(), sectionId: z.string(), groupId: z.string(), slug: z.string(),
  title: z.string(), description: z.string(), estimatedMinutes: z.number().int().min(10).max(180),
  defaultPriority: z.number().int().min(1).max(5), difficulty: z.number().int().min(1).max(5), sortOrder: z.number(), prerequisiteIds: z.array(z.string()),
})
export const taskSchema = z.object({
  id: z.string().uuid(), topicId: z.string(), position: z.number().int().positive(), plannedMinutes: z.number().int().min(10).max(180),
  reason: z.string(), status: z.enum(["planned", "in_progress", "completed", "skipped"]), completedAt: z.string().nullable(), skippedAt: z.string().nullable(),
})
const planSchema = z.object({
  id: z.string().uuid(), planDate: dateSchema, algorithmVersion: z.string(), status: z.enum(["active", "archived"]),
  totalMinutes: z.number().int().nonnegative(), dailyBudget: z.number(), taskLimit: z.number(), generatedAt: z.string(), tasks: z.array(taskSchema),
})
export const workspaceSchema = z.object({
  revision: z.number().int().nonnegative(), today: dateSchema, preferences: studyPreferencesSchema,
  catalog: z.object({
    id: z.string(), examCode: z.literal("cat"), version: z.string(), label: z.string(), disclaimer: z.string(),
    sections: z.array(z.object({ id: z.string(), code: z.enum(["VARC", "DILR", "QA"]), name: z.string(), description: z.string(), sortOrder: z.number() })),
    groups: z.array(z.object({ id: z.string(), sectionId: z.string(), name: z.string(), description: z.string(), sortOrder: z.number() })),
    topics: z.array(topicSchema).min(1),
  }),
  progress: z.array(progressSchema), plans: z.array(planSchema),
})
export type WorkspaceSnapshot = z.infer<typeof workspaceSchema>
export type WorkspacePlan = z.infer<typeof planSchema>
export type WorkspacePlanTask = z.infer<typeof taskSchema>
export function enrichWorkspace(snapshot: WorkspaceSnapshot) {
  return { ...snapshot, activePlan: snapshot.plans.find((plan) => plan.planDate === snapshot.today) ?? null,
    summary: aggregateProgress(snapshot.catalog.topics, new Map(snapshot.progress.map((item) => [item.topicId, item]))) }
}
export type CatWorkspaceData = ReturnType<typeof enrichWorkspace>
export type ActionFailureCode = "not_configured" | "unauthenticated" | "validation" | "database" | "conflict"
export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: ActionFailureCode; message: string }
export const mutationEnvelopeSchema = z.object({ requestId: z.string().uuid(), expectedRevision: z.number().int().nonnegative() })
