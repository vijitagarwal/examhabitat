"use server"

import { revalidatePath } from "next/cache"
import { browsePractice, commandPractice, markPractice, readPractice, readPracticeHistory, readPracticeMistakes, startPractice } from "@/lib/server/practice"

export async function browseQuestions(input: unknown) { return browsePractice(input) }
export async function startSession(input: unknown) { return startPractice(input) }
export async function refreshSession(input: unknown) { return readPractice(input) }
export async function saveSession(input: unknown) {
  const result = await commandPractice(input)
  if (result.ok && result.data.status !== "active") {
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/practice/history")
    revalidatePath("/dashboard/practice/mistakes")
  }
  return result
}
export async function markQuestion(input: unknown) { return markPractice(input) }
export async function loadHistory(input: unknown) { return readPracticeHistory(input) }
export async function loadMistakes(input: unknown) { return readPracticeMistakes(input) }
