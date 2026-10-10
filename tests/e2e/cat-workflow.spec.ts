import { createServerClient } from "@supabase/ssr"
import { expect, test } from "@playwright/test"
import type { Database } from "@/lib/supabase/database.types"
import { workspaceSchema } from "@/lib/workspace"

test.skip(process.env.CAT_E2E_AUTH !== "1", "Requires local Supabase and a fresh disposable local account.")
test("saved progress survives reload, then a generated block can be completed", async ({ page, context }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname)
  const cookies: Array<Parameters<typeof context.addCookies>[0][number]> = []
  const jar = new Map<string, string>()
  const supabase = createServerClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => {
      for (const cookie of values) {
        jar.set(cookie.name, cookie.value)
        cookies.push({ name: cookie.name, value: cookie.value, url: "http://127.0.0.1:3100", sameSite: "Lax" })
      }
    } },
  })
  const signedIn = await supabase.auth.signInWithPassword({ email: process.env.CAT_E2E_EMAIL!, password: process.env.CAT_E2E_PASSWORD! })
  expect(signedIn.error === null).toBe(true)
  await context.addCookies(cookies)
  // Password login only provisions the local test session. The real UI remains magic-link only.
  await page.goto("/dashboard/syllabus")
  await expect(page.getByRole("heading", { name: "Know what to work on." })).toBeVisible()
  const snapshot = await supabase.rpc("read_cat_workspace")
  const data = workspaceSchema.parse(snapshot.data)
  const topic = data.catalog.topics.find((t) => !data.progress.some((p) => p.topicId === t.id))
  expect(topic, "Use a fresh disposable account for this test").toBeDefined()
  await page.getByRole("link", { name: new RegExp(topic!.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click()
  await page.getByRole("combobox", { name: "Learning status" }).selectOption("learning")
  await page.getByRole("combobox", { name: "Confidence · 1 low, 5 high" }).selectOption("4")
  await page.getByRole("spinbutton", { name: "Add study minutes" }).fill("25")
  await page.getByRole("button", { name: "Save progress" }).click()
  await expect(page.getByText("Progress saved to your account.")).toBeVisible()
  await page.reload()
  await page.getByRole("link", { name: new RegExp(topic!.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click()
  await expect(page.getByRole("combobox", { name: "Confidence · 1 low, 5 high" })).toHaveValue("4")
  await expect(page.getByText("25 minutes", { exact: true })).toBeVisible()
  await page.goto("/dashboard/plan")
  await page.getByRole("button", { name: /Generate today’s queue|Regenerate today’s queue/ }).click()
  await expect(page.getByText(/Study queue saved/)).toBeVisible()
  await page.getByRole("button", { name: "Complete block" }).first().click()
  await expect(page.getByText("Task status saved.")).toBeVisible()
  await page.reload()
  await expect(page.getByText("completed", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/auth$/)
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "Enter your private workspace" })).toBeVisible()
})
