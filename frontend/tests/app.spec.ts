import { expect, test } from '@playwright/test'

test('seeded dashboard, results export, and mobile layout', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Course attainment.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Attainment overview' })).toBeVisible()
  await expect(page.getByLabel('Current course')).toContainText('Database Management Systems')
  await page.screenshot({
    path: 'test-results/dashboard.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('navigation').getByRole('button', { name: 'Results' }).click()
  await expect(page.locator('.result-card')).toHaveCount(4)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  expect((await download).suggestedFilename()).toBe('CS301-attainment-50.csv')
  await page.getByLabel('Score threshold').fill('80')
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.getByText('Calculated from saved scores. Score threshold: 80%.')).toBeVisible()
  await expect(page.locator('.result-card').first().locator('.result-number')).toHaveText('37.5%')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByLabel('Open navigation').click()
  await page.getByRole('navigation').getByRole('button', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Course attainment.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Attainment overview' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await expect
    .poll(() =>
      page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true, animations: 'disabled' })
  expect(errors).toEqual([])
})

test('faculty can create, edit, score, calculate, and delete a complete course', async ({
  page,
  request,
}) => {
  const code = `QA${Date.now()}`
  let courseId: number | undefined
  try {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Attainment overview' })).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Courses' }).click()
    await page.getByRole('button', { name: 'Add course', exact: true }).first().click()
    let dialog = page.getByRole('dialog')
    await dialog.getByLabel('Course name').fill('Quality Assurance Course')
    await dialog.getByLabel('Course code').fill(code)
    await dialog.getByRole('button', { name: 'Add course', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    courseId = Number(await page.getByLabel('Current course').inputValue())
    await page.getByRole('button', { name: 'Edit Quality Assurance Course', exact: true }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Course name').fill('Quality Assurance Lab')
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await page.getByRole('tab', { name: 'Course outcomes', exact: true }).click()
    await page.getByRole('button', { name: 'Add outcome', exact: true }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Outcome code').fill('CO1')
    await dialog.getByLabel('Learning outcome').fill('Explain boundary conditions.')
    await dialog.getByRole('button', { name: 'Add course outcome', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await page.getByLabel('Edit CO1', { exact: true }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Learning outcome').fill('Verify inclusive threshold boundaries.')
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(
      page.getByText('Verify inclusive threshold boundaries.', { exact: true }),
    ).toBeVisible()
    await page
      .getByRole('navigation')
      .getByRole('button', { name: 'Students', exact: true })
      .click()
    for (const [name, roll] of [
      ['Boundary Student', 'QA001'],
      ['Below Student', 'QA002'],
      ['Unscored Student', 'QA003'],
    ]) {
      await page.getByRole('button', { name: 'Add student', exact: true }).click()
      dialog = page.getByRole('dialog')
      await dialog.getByLabel('Student name').fill(name)
      await dialog.getByLabel('Roll number').fill(roll)
      await dialog.getByRole('button', { name: 'Add student', exact: true }).click()
      await expect(dialog).not.toBeVisible()
    }
    await page.getByLabel('Edit Unscored Student', { exact: true }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Student name').fill('Pending Student')
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Dashboard' }).click()
    await page.getByRole('tab', { name: 'Score register' }).click()
    const boundaryInput = page.getByLabel('Boundary Student, CO1 score', { exact: true })
    await boundaryInput.fill('101')
    await expect(boundaryInput).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('button', { name: 'Save scores' })).toBeDisabled()
    await boundaryInput.fill('50')
    await page.getByLabel('Below Student, CO1 score', { exact: true }).fill('49.99')
    await page.getByRole('navigation').getByRole('button', { name: 'Results' }).click()
    await expect(page.getByRole('dialog', { name: 'Discard unsaved scores?' })).toBeVisible()
    await page.getByRole('button', { name: 'Keep editing' }).click()
    await page.getByRole('button', { name: 'Add student', exact: true }).click()
    await page.getByRole('button', { name: 'Discard changes' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(boundaryInput).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Save scores' })).toBeDisabled()
    await boundaryInput.fill('50')
    await page.getByLabel('Below Student, CO1 score', { exact: true }).fill('49.99')
    await page.getByRole('button', { name: 'Save scores' }).click()
    await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
    const detail = await (await request.get(`/api/courses/${courseId}`)).json()
    expect(detail.scores.map((score: { value: number }) => score.value).sort()).toEqual([49.99, 50])
    await page.reload()
    await page.getByLabel('Current course').selectOption(String(courseId))
    await page.getByRole('tab', { name: 'Score register' }).click()
    await expect(boundaryInput).toHaveValue('50')
    await page.getByRole('navigation').getByRole('button', { name: 'Results' }).click()
    await expect(page.locator('.result-card').locator('.result-number')).toHaveText('50%')
    await expect(page.locator('.result-details')).toContainText('1 attained')
    await expect(page.locator('.result-details')).toContainText('2 evaluated')
    await page.getByLabel('Score threshold').fill('50.01')
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    await expect(page.locator('.result-card').locator('.result-number')).toHaveText('0%')
    await page.getByRole('navigation').getByRole('button', { name: 'Dashboard' }).click()
    await page.getByRole('tab', { name: 'Score register' }).click()
    await page.getByLabel('Below Student, CO1 score', { exact: true }).fill('')
    await page.getByRole('button', { name: 'Save scores' }).click()
    await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
    expect((await (await request.get(`/api/courses/${courseId}/scores`)).json()).length).toBe(1)
    await page
      .getByRole('navigation')
      .getByRole('button', { name: 'Students', exact: true })
      .click()
    await page.getByLabel('Delete Pending Student', { exact: true }).click()
    await page.getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('Pending Student', { exact: true })).not.toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Courses' }).click()
    await page.getByRole('tab', { name: 'Course outcomes' }).click()
    await page.getByLabel('Delete CO1', { exact: true }).click()
    await page.getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'What will students learn?' })).toBeVisible()
    await page.getByLabel('Delete Quality Assurance Lab', { exact: true }).click()
    await page.getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Quality Assurance Lab', exact: true }),
    ).not.toBeVisible()
    expect((await request.get(`/api/courses/${courseId}`)).status()).toBe(404)
  } finally {
    if (courseId) await request.delete(`/api/courses/${courseId}`)
  }
})

test('Swagger UI renders the documented API', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/docs')
  await expect(page.getByRole('heading', { name: /Rubrix OBE API/ })).toBeVisible()
  await expect(page.locator('.opblock-summary').first()).toBeVisible()
})
