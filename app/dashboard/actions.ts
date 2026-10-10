"use server"

import { executeWorkspaceMutation } from "@/lib/server/mutations"
import { revalidatePath } from "next/cache"
import type { MutationOperation } from "@/lib/server/mutations"

async function mutate(operation: MutationOperation, input: unknown) {
  const result = await executeWorkspaceMutation(operation, input)
  if (result.ok) {
    for (const path of ["/dashboard", "/dashboard/syllabus", "/dashboard/plan"]) revalidatePath(path)
  }
  return result
}
export async function saveTopicProgress(input: unknown) { return mutate("progress", input) }
export async function saveStudyPreferences(input: unknown) { return mutate("preferences", input) }
export async function generateAndSaveStudyPlan(input: unknown) { return mutate("plan", input) }
export async function updateStudyTaskStatus(input: unknown) { return mutate("task", input) }
