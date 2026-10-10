"use server"

import { executeWorkspaceMutation } from "@/lib/server/mutations"

export async function saveTopicProgress(input: unknown) { return executeWorkspaceMutation("progress", input) }
export async function saveStudyPreferences(input: unknown) { return executeWorkspaceMutation("preferences", input) }
export async function generateAndSaveStudyPlan(input: unknown) { return executeWorkspaceMutation("plan", input) }
export async function updateStudyTaskStatus(input: unknown) { return executeWorkspaceMutation("task", input) }
