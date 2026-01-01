import { test, expect } from "@playwright/test"

test.describe("Counter Application", () => {
  test("page loads with counter display", async ({ page }) => {
    await page.goto("/")

    await expect(page).toHaveTitle("Counter")
    await expect(page.locator("h1")).toHaveText("Counter")
    await expect(page.locator(".count")).toBeVisible()
    await expect(page.locator("button.increment")).toBeVisible()
    await expect(page.locator("button.decrement")).toBeVisible()
  })

  test("increment button increases count", async ({ page }) => {
    await page.goto("/")

    const countElement = page.locator(".count")
    const initialCount = parseInt((await countElement.textContent()) || "0")

    await page.locator("button.increment").click()

    await expect(countElement).toHaveText(String(initialCount + 1))
  })

  test("decrement button decreases count", async ({ page }) => {
    await page.goto("/")

    const countElement = page.locator(".count")
    const initialCount = parseInt((await countElement.textContent()) || "0")

    await page.locator("button.decrement").click()

    await expect(countElement).toHaveText(String(initialCount - 1))
  })
})
