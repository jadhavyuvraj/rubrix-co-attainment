import { expect, test } from '@playwright/test'

test('a successful score save stays visible when the follow-up refresh fails', async ({
  page,
  request,
}) => {
  const course = await (
    await request.post('/api/courses', {
      data: { code: `RC${Date.now()}`, name: 'Save recovery test' },
    })
  ).json()
  const base = `/api/courses/${course.id}`
  try {
    await request.post(`${base}/cos`, {
      data: { code: 'CO1', description: 'Recover from a refresh error.' },
    })
    await request.post(`${base}/students`, {
      data: { name: 'Recovery Student', roll_number: 'RC001' },
    })
    await page.goto('/')
    await page.getByLabel('Current course').selectOption(String(course.id))
    await page.getByRole('tab', { name: 'Score register' }).click()
    const score = page.getByLabel('Recovery Student, CO1 score')
    await score.fill('65')
    await page.route('**/api/courses', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Temporary refresh failure.' }),
      }),
    )
    await page.getByRole('button', { name: 'Save scores' }).click()
    await expect(page.getByRole('alert')).toContainText(
      'Your scores were saved, but results could not refresh.',
    )
    await expect(score).toHaveValue('65')
    await expect(page.getByRole('button', { name: 'Save scores' })).toBeDisabled()
    expect((await (await request.get(`${base}/scores`)).json())[0].value).toBe(65)
  } finally {
    await request.delete(base)
  }
})
