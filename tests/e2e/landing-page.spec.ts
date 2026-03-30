import { expect, test } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders hero content', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        name: /run obs and propresenter in sync without tab chaos/i,
      }),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: /connect now/i })).toBeVisible()
  })

  test('navigates to connect dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /connect now/i }).click()

    await expect(page).toHaveURL(/\/connect$/)
    await expect(
      page.getByRole('heading', { name: /media team combined remote/i }),
    ).toBeVisible()
  })
})
