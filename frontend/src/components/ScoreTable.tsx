import { useEffect, useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Check, Info, Plus, Save, Search } from 'lucide-react'
import type { CourseDetail, Notice, Score } from '../types'
import { api } from '../services/api'
import { EmptyState } from './ui'

export function ScoreTable({
  course,
  threshold,
  onDirty,
  onBusy,
  onSaved,
  notify,
  onAddStudent,
}: {
  course: CourseDetail
  threshold: number
  onDirty: (dirty: boolean) => void
  onBusy: (busy: boolean) => void
  onSaved: () => Promise<void>
  notify: (notice: Notice) => void
  onAddStudent: () => void
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [descending, setDescending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedScores, setSavedScores] = useState(course.scores)
  useEffect(() => setSavedScores(course.scores), [course.scores])
  const saved = useMemo(
    () =>
      Object.fromEntries(
        savedScores.map((score) => [`${score.student_id}:${score.co_id}`, String(score.value)]),
      ),
    [savedScores],
  )
  const students = course.students
    .filter((student) =>
      `${student.name} ${student.roll_number}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => (descending ? -1 : 1) * a.name.localeCompare(b.name))
  const dirtyCount = Object.keys(drafts).length
  const isValid = (value: string) =>
    value.trim() === '' ||
    (/^(\d+(\.\d*)?|\.\d+)$/.test(value) && Number(value) >= 0 && Number(value) <= 100)
  const invalid = Object.values(drafts).some((value) => !isValid(value))
  const latestSaved = savedScores.length
    ? new Date(Math.max(...savedScores.map((score) => new Date(score.updated_at).getTime())))
    : null
  useEffect(() => onDirty(dirtyCount > 0), [dirtyCount, onDirty])

  function change(key: string, value: string) {
    setDrafts((current) => {
      const next = { ...current }
      if (value === (saved[key] ?? '')) delete next[key]
      else next[key] = value
      return next
    })
  }

  async function save() {
    if (invalid || !dirtyCount) return
    setSaving(true)
    onBusy(true)
    try {
      const scores = await api.save<Score[]>(
        `/courses/${course.id}/scores`,
        {
          scores: Object.entries(drafts).map(([key, value]) => {
            const [student_id, co_id] = key.split(':').map(Number)
            return { student_id, co_id, value: value.trim() === '' ? null : Number(value) }
          }),
        },
        'PUT',
      )
      setSavedScores(scores)
      setDrafts({})
      onDirty(false)
      notify({
        type: 'success',
        message: `${dirtyCount} score${dirtyCount === 1 ? '' : 's'} saved. Attainment updated.`,
      })
      try {
        await onSaved()
      } catch {
        notify({
          type: 'error',
          message:
            'Your scores were saved, but results could not refresh. Reload to see updated attainment.',
        })
      }
    } catch (err) {
      notify({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not save scores.',
      })
    } finally {
      setSaving(false)
      onBusy(false)
    }
  }

  return (
    <section className="panel score-panel">
      <div className="panel-heading">
        <div>
          <h2>
            Student score register <span className="count-badge">{course.students.length}</span>
          </h2>
          <p>Enter each student’s score out of 100. Clear a cell to remove a score.</p>
        </div>
        <button
          className="button primary"
          onClick={save}
          disabled={!dirtyCount || invalid || saving}
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save scores'}
        </button>
      </div>
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={15} />
          <input
            aria-label="Search students"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or roll number…"
          />
        </div>
        <button
          className="button secondary sort-button"
          onClick={() => setDescending((value) => !value)}
          aria-label={descending ? 'Sort names ascending' : 'Sort names descending'}
        >
          {descending ? <ArrowUpAZ size={15} /> : <ArrowDownAZ size={15} />}Name
        </button>
        <button className="text-button ml-auto" onClick={onAddStudent} disabled={saving}>
          <Plus size={15} />
          Add student
        </button>
      </div>
      {!course.students.length ? (
        <EmptyState title="No students in this course">
          Add your students to start recording scores.
        </EmptyState>
      ) : !course.cos.length ? (
        <EmptyState title="Define a learning outcome first">
          Add an outcome in the Course outcomes tab, then return to enter scores.
        </EmptyState>
      ) : (
        <div className="table-scroll">
          <table className="score-table">
            <thead>
              <tr>
                <th className="student-column">STUDENT</th>
                {course.cos.map((co) => (
                  <th key={co.id} title={co.description}>
                    <span className="co-tag">{co.code}</span>
                    <span className="out-of">/ 100</span>
                  </th>
                ))}
                <th className="text-right">RECORDED</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td className="student-column">
                    <div className="student-cell">
                      <div className={`student-avatar avatar-${index % 4}`}>
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <strong>{student.name}</strong>
                        <span>{student.roll_number}</span>
                      </div>
                    </div>
                  </td>
                  {course.cos.map((co) => {
                    const key = `${student.id}:${co.id}`
                    const value = drafts[key] ?? saved[key] ?? ''
                    const changed = key in drafts
                    const valid = isValid(value)
                    return (
                      <td key={co.id}>
                        <div className="score-input-wrap">
                          <input
                            className={`score-input ${changed ? 'is-dirty' : ''} ${!valid ? 'is-invalid' : ''} ${value !== '' && valid && Number(value) >= threshold ? 'is-attained' : ''}`}
                            inputMode="decimal"
                            aria-label={`${student.name}, ${co.code} score`}
                            aria-invalid={!valid}
                            aria-describedby={!valid ? `error-${key}` : undefined}
                            value={value}
                            onChange={(event) => change(key, event.target.value)}
                            disabled={saving}
                            placeholder="—"
                          />
                          {changed && <span className="dirty-dot" />}
                        </div>
                        {!valid && (
                          <span className="cell-error" id={`error-${key}`}>
                            Use 0–100
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-right">
                    <span className="recorded-count">
                      {
                        course.cos.filter((co) => saved[`${student.id}:${co.id}`] !== undefined)
                          .length
                      }
                      <span> / {course.cos.length}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr>
                  <td colSpan={course.cos.length + 2}>
                    <div className="p-8 text-center text-xs text-slate-500">
                      No students match “{search}”.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-footer">
        <span className={dirtyCount ? 'unsaved-label' : 'saved-label'}>
          {dirtyCount ? (
            <>
              <span className="dirty-dot static" />
              {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
            </>
          ) : (
            <>
              <Check size={13} />
              All changes saved
            </>
          )}
        </span>
        {latestSaved && !dirtyCount && (
          <span className="last-saved" title={latestSaved.toLocaleString()}>
            Last saved {latestSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {dirtyCount > 0 && (
          <button className="text-button" disabled={saving} onClick={() => setDrafts({})}>
            Reset changes
          </button>
        )}
        <span className="table-note">
          <Info size={12} />
          Blank scores are excluded from attainment.
        </span>
      </div>
    </section>
  )
}
