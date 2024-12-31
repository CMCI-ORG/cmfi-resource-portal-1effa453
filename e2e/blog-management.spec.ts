import { test, expect } from "@playwright/test"

test.describe("Blog Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/blog")
  })

  test("should display WordPress feed parser", async ({ page }) => {
    await expect(page.getByText("Import WordPress Blogs")).toBeVisible()
  })

  test("should handle feed submission", async ({ page }) => {
    await page.fill('[placeholder="Enter feed name"]', "Test Blog")
    await page.fill('[placeholder="Enter WordPress RSS feed URL"]', "https://test.com/feed")
    await page.click("text=Import")

    // Wait for success toast
    await expect(page.getByText("WordPress feeds parsed and articles imported successfully")).toBeVisible()
  })

  test("should validate feed URL", async ({ page }) => {
    await page.fill('[placeholder="Enter feed name"]', "Test Blog")
    await page.fill('[placeholder="Enter WordPress RSS feed URL"]', "invalid-url")
    await page.click("text=Import")

    // Wait for error toast
    await expect(page.getByText("Please enter valid feed names and URLs")).toBeVisible()
  })

  test("should toggle display summary option", async ({ page }) => {
    const switchElement = page.getByRole("switch")
    await expect(switchElement).toBeVisible()
    
    // Should be checked by default
    await expect(switchElement).toBeChecked()
    
    // Toggle off
    await switchElement.click()
    await expect(switchElement).not.toBeChecked()
  })
})