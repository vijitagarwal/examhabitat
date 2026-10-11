import { expect, test } from "@playwright/test"

test.skip(process.env.CAT_E2E_AUTH === "1", "This suite tests the intentionally unconfigured app.")
test("unconfigured routes expose setup, never private demo data", async ({ page }) => {
  for (const path of ["/dashboard", "/dashboard/syllabus", "/dashboard/plan", "/dashboard/performance"]) {
    await page.goto(path)
    await expect(page.getByRole("heading", { name: "Connect your saved workspace" })).toBeVisible()
    await expect(page.getByText("Demo workspace")).toHaveCount(0)
  }
})
test("mobile navigation and expired-link recovery are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Open navigation" }).click()
  await page.locator("#mobile-navigation").getByRole("link", { name: "Syllabus" }).click()
  await expect(page).toHaveURL(/\/dashboard\/syllabus$/)
  await page.goto("/auth/callback?next=https://example.com")
  await expect(page).toHaveURL(/\/auth\?link=expired$/)
  await expect(page.getByRole("alert")).toContainText("could not be verified")
})
