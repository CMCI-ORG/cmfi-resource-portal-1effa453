import { test, expect } from "@playwright/test"

test.describe("Blog Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the blog management page
    await page.goto("/admin/blog")
  })

  test("should display WordPress feed parser", async ({ page }) => {
    await expect(page.getByText("Import WordPress Blogs")).toBeVisible()
  })

  test("should handle feed submission", async ({ page }) => {
    await page.fill('[placeholder="Enter feed name"]', "Test Blog")
    await page.fill('[placeholder="Enter WordPress RSS feed URL"]', "https://test.com/feed")
    await page.click("text=Import")

    // Wait for success message
    await expect(page.getByText(/successfully/i)).toBeVisible()
  })

  test("should validate feed URL", async ({ page }) => {
    await page.fill('[placeholder="Enter feed name"]', "Test Blog")
    await page.fill('[placeholder="Enter WordPress RSS feed URL"]', "invalid-url")
    await page.click("text=Import")

    // Wait for error message
    await expect(page.getByText(/Please enter valid feed/i)).toBeVisible()
  })
})