import { test, expect } from '@playwright/test'

test('totals update while typing and survive a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByLabel('Number of $500 bills').pressSequentially('3')
  await expect(page.getByTestId('total')).toHaveText('$1,500')
  await page.reload()
  await expect(page.getByTestId('total')).toHaveText('$1,500')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear amounts' }).click()
  await expect(page.getByTestId('total')).toHaveText('$0')
})
