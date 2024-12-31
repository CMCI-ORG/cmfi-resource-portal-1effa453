import { test, expect } from "@playwright/test"

test.describe("PodcastFeedParser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
  })

  test("shows validation error for empty URL", async ({ page }) => {
    await page.getByTestId("import-button").click()
    await expect(page.getByText("Please enter a feed URL")).toBeVisible()
  })

  test("shows validation error for invalid URL", async ({ page }) => {
    await page.getByTestId("feed-url-input").fill("invalid-url")
    await page.getByTestId("import-button").click()
    await expect(page.getByText("Please enter a valid URL")).toBeVisible()
  })

  test("shows progress during import", async ({ page }) => {
    await page.getByTestId("feed-url-input").fill("https://valid-feed.com/rss")
    await page.getByTestId("import-button").click()
    await expect(page.getByTestId("progress-bar")).toBeVisible()
    await expect(page.getByTestId("status-message")).toBeVisible()
  })

  test("handles successful import", async ({ page }) => {
    await page.getByTestId("feed-url-input").fill("https://valid-feed.com/rss")
    await page.getByTestId("import-button").click()
    await expect(page.getByText("Import completed successfully!")).toBeVisible()
  })

  test("handles import error", async ({ page }) => {
    // Mock the edge function to return an error
    await page.route("**/functions/v1/parse-podcast-feed", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Failed to parse feed" })
      })
    })

    await page.getByTestId("feed-url-input").fill("https://valid-feed.com/rss")
    await page.getByTestId("import-button").click()
    await expect(page.getByText("Failed to parse feed")).toBeVisible()
  })
})