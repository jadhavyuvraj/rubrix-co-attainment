import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers3,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { StatCard, LoadingSkeleton, EmptyState, Toast, Modal, formatPercent } from './components/ui'
import { AttainmentChart } from './components/AttainmentChart'
import { ThresholdControl } from './components/ThresholdControl'
import { useWorkspace } from './hooks/useWorkspace'
import type { Course, Notice, Page, Tab } from './types'
import { EntityForm, type Editor } from './components/EntityForm'
import { ScoreTable } from './components/ScoreTable'
import { Courses, Outcomes } from './pages/Courses'
import { Students } from './pages/Students'
import { Results } from './pages/Results'
import { api } from './services/api'

export default function App() {
  const workspace = useWorkspace()
  const {
    courses,
    selectedId,
    setSelectedId,
    detail,
    results,
    threshold,
    setThreshold,
    loading,
    error,
  } = workspace
  const [page, setPage] = useState<Page>('dashboard')
  const [tab, setTab] = useState<Tab>('overview')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [deletion, setDeletion] = useState<{
    title: string
    description: string
    path: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [savingScores, setSavingScores] = useState(false)
  const [draftVersion, setDraftVersion] = useState(0)
  const [pending, setPending] = useState<{ action: () => void } | null>(null)
  const dismiss = useCallback(() => setNotice(null), [])
  const guard = (action: () => void) => {
    if (savingScores) {
      setNotice({ type: 'error', message: 'Please wait for your scores to finish saving.' })
      return
    }
    if (dirty) setPending({ action })
    else action()
  }
  const navigate = (next: Page) => {
    if (next !== page)
      guard(() => {
        setPage(next)
        setTab('overview')
      })
  }
  const remove = (title: string, description: string, path: string) =>
    guard(() => {
      setDeleteError('')
      setDeletion({ title, description, path })
    })
  const openEditor = (value: Editor) => guard(() => setEditor(value))
  const refresh = useCallback(() => workspace.refreshCourses(), [workspace.refreshCourses])
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
  async function saveEntity(data: Record<string, string | number>) {
    if (!editor) return
    const root =
      editor.kind === 'course'
        ? '/courses'
        : `/courses/${selectedId}/${editor.kind === 'co' ? 'cos' : 'students'}`
    const saved = await api.save<Course>(
      editor.record ? `${root}/${editor.record.id}` : root,
      data,
      editor.record ? 'PUT' : 'POST',
    )
    await workspace.refreshCourses(editor.kind === 'course' ? saved.id : undefined)
    setNotice({
      type: 'success',
      message: `${editor.kind === 'co' ? 'Course outcome' : editor.kind === 'course' ? 'Course' : 'Student'} ${editor.record ? 'updated' : 'added'}.`,
    })
    setEditor(null)
  }
  async function deleteRecord() {
    if (!deletion) return
    setDeleting(true)
    try {
      await api.remove(deletion.path)
      await workspace.refreshCourses()
      setNotice({ type: 'success', message: 'Record deleted.' })
      setDeletion(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this record.')
    } finally {
      setDeleting(false)
    }
  }
  const evaluated = results.filter((result) => result.total_students > 0)
  const average = evaluated.length
    ? evaluated.reduce((sum, result) => sum + result.attainment_percentage, 0) / evaluated.length
    : null
  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} courseCount={courses.length} />
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{page.charAt(0).toUpperCase() + page.slice(1)}</strong>
          </div>
          <div className="topbar-right">
            <span className="term-pill">
              <span className="online-dot" />
              Academic year {detail?.academic_year || '2026–27'}
            </span>
            <span className="header-divider" />
            <div className="header-avatar">
              <GraduationCap size={20} />
            </div>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">OUTCOME-BASED EDUCATION</div>
              <h1>
                {page === 'dashboard'
                  ? 'Course attainment'
                  : page === 'courses'
                    ? 'Your teaching workspace'
                    : page === 'students'
                      ? 'Your students'
                      : 'Attainment results'}
                <span>.</span>
              </h1>
              <p>
                {page === 'dashboard'
                  ? 'Turn student performance into meaningful learning insights.'
                  : page === 'courses'
                    ? 'Define learning objectives. Build a clear picture of progress.'
                    : page === 'students'
                      ? 'Manage your class, one learner at a time.'
                      : 'Understand what your students have achieved, outcome by outcome.'}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() =>
                page === 'courses' ? openEditor({ kind: 'course' }) : navigate('courses')
              }
            >
              <BookOpen size={17} />
              {page === 'courses' ? 'Add course' : 'Manage courses'}
              <ArrowRight size={15} />
            </button>
          </div>
          {page === 'dashboard' && (
            <section className="stats-grid" aria-label="Workspace statistics">
              <StatCard
                label="Total courses"
                value={String(courses.length).padStart(2, '0')}
                detail="Across your workspace"
                icon={<BookOpen size={18} />}
              />
              <StatCard
                label="Course outcomes"
                value={courses.reduce((sum, course) => sum + course.co_count, 0)}
                detail="Defined learning objectives"
                icon={<Layers3 size={18} />}
              />
              <StatCard
                label="Student enrollments"
                value={courses.reduce((sum, course) => sum + course.student_count, 0)}
                detail="Counted once per course"
                icon={<Users size={18} />}
              />
              <StatCard
                label="Average attainment"
                value={
                  average === null ? (
                    '—'
                  ) : (
                    <>
                      {formatPercent(average)}
                      <small>%</small>
                    </>
                  )
                }
                detail="Selected course · evaluated COs"
                icon={<TrendingUp size={18} />}
                accent
              />
            </section>
          )}
          {page === 'courses' && (
            <Courses
              courses={courses}
              selectedId={selectedId}
              onSelect={(id) =>
                guard(() => {
                  setSelectedId(id)
                  setTab('outcomes')
                })
              }
              onAdd={() => openEditor({ kind: 'course' })}
              onEdit={(course) => openEditor({ kind: 'course', record: course })}
              onDelete={(course) =>
                remove(
                  `Delete ${course.code}?`,
                  'This permanently deletes the course, its outcomes, enrolled students, and all recorded scores.',
                  `/courses/${course.id}`,
                )
              }
            />
          )}
          <section className="course-strip">
            <div className="course-icon">
              <BookOpen size={24} />
            </div>
            <div className="course-select-wrap">
              <label htmlFor="selected-course">CURRENT COURSE</label>
              <select
                id="selected-course"
                value={selectedId ?? ''}
                onChange={(event) => {
                  const id = Number(event.target.value)
                  guard(() => setSelectedId(id))
                }}
              >
                {!courses.length && <option value="">No courses yet</option>}
                {courses.map((course) => (
                  <option value={course.id} key={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <div className="course-meta">
                {detail && (
                  <>
                    <span>{detail.code}</span>
                    <i />
                    Semester {detail.semester}
                    <i />
                    {detail.department}
                  </>
                )}
              </div>
            </div>
            <div className="course-strip-count">
              <Users size={16} />
              {detail?.student_count ?? 0} students
              <span />
              <Layers3 size={16} />
              {detail?.co_count ?? 0} outcomes
            </div>
          </section>
          <div className="workspace-toolbar">
            {page === 'dashboard' || page === 'courses' ? (
              <div className="tabs" role="tablist" aria-label="Course views">
                {(['overview', 'scores', 'outcomes'] as const).map((value) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={tab === value}
                    className={tab === value ? 'active' : ''}
                    onClick={() => {
                      if (value !== tab) guard(() => setTab(value))
                    }}
                  >
                    {value === 'overview'
                      ? 'Overview'
                      : value === 'scores'
                        ? 'Score register'
                        : 'Course outcomes'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="toolbar-label">
                {page === 'students' ? 'CLASS REGISTER' : 'COURSE PERFORMANCE'}
              </div>
            )}
            <ThresholdControl
              value={threshold}
              onChange={(value) => guard(() => setThreshold(value))}
            />
          </div>
          {error ? (
            <div className="error-panel" role="alert">
              <h3>Couldn’t load your workspace</h3>
              <p>{error}</p>
              <button
                className="button secondary"
                onClick={() =>
                  workspace
                    .refreshCourses()
                    .catch((err) => setNotice({ type: 'error', message: err.message }))
                }
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <LoadingSkeleton />
          ) : !detail ? (
            <EmptyState
              title="A fresh start for your course"
              action={
                <button className="button primary" onClick={() => openEditor({ kind: 'course' })}>
                  <Plus size={15} />
                  Add course
                </button>
              }
            >
              Create your first course to define outcomes and record scores.
            </EmptyState>
          ) : page === 'students' ? (
            <Students
              course={detail}
              onAdd={() => openEditor({ kind: 'student' })}
              onEdit={(student) => openEditor({ kind: 'student', record: student })}
              onDelete={(student) =>
                remove(
                  `Delete ${student.name}?`,
                  'This removes the student and their recorded scores from this course.',
                  `/courses/${detail.id}/students/${student.id}`,
                )
              }
            />
          ) : page === 'results' ? (
            <Results course={detail} results={results} threshold={threshold} />
          ) : tab === 'scores' ? (
            <ScoreTable
              key={`${detail.id}:${draftVersion}`}
              course={detail}
              threshold={threshold}
                onDirty={setDirty}
                onBusy={setSavingScores}
              onSaved={refresh}
              notify={setNotice}
              onAddStudent={() => openEditor({ kind: 'student' })}
            />
          ) : tab === 'outcomes' ? (
            <Outcomes
              course={detail}
              onAdd={() => openEditor({ kind: 'co' })}
              onEdit={(co) => openEditor({ kind: 'co', record: co })}
              onDelete={(co) =>
                remove(
                  `Delete ${co.code}?`,
                  'This permanently deletes the outcome and every score recorded against it.',
                  `/courses/${detail.id}/cos/${co.id}`,
                )
              }
            />
          ) : (
            <>
              <AttainmentChart results={results} threshold={threshold} />
              <section className="panel mt-6">
                <div className="panel-heading">
                  <div>
                    <h2>Your course outcomes</h2>
                    <p>
                      {detail.co_count} learning objectives for {detail.code}
                    </p>
                  </div>
                  <button className="button secondary" onClick={() => setTab('scores')}>
                    Open score register
                    <ArrowRight size={15} />
                  </button>
                </div>
                {detail.cos.length ? (
                  <div className="outcome-preview">
                    {detail.cos.map((co) => (
                      <div key={co.id}>
                        <span className="co-tag">{co.code}</span>
                        <p>{co.description}</p>
                        <button
                          className="icon-button"
                          aria-label={`Manage ${co.code}`}
                          onClick={() => setTab('outcomes')}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Define your first outcome"
                    action={
                      <button className="button primary" onClick={() => openEditor({ kind: 'co' })}>
                        Add outcome
                      </button>
                    }
                  >
                    Add learning objectives before recording scores.
                  </EmptyState>
                )}
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              <span className="footer-brand">rubrix.</span> Institutional excellence, one outcome at
              a time.
            </span>
            <span>
              OBE Workspace <span className="footer-dot">·</span> v1.0
            </span>
          </footer>
        </div>
      </main>
      <Toast notice={notice} onClose={dismiss} />
      {editor && <EntityForm editor={editor} onClose={() => setEditor(null)} onSave={saveEntity} />}
      {deletion && (
        <Modal title={deletion.title} onClose={() => setDeletion(null)} busy={deleting}>
          <p className="modal-description">{deletion.description}</p>
          {deleteError && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={deleting}
              onClick={() => setDeletion(null)}
            >
              Cancel
            </button>
            <button className="button danger" disabled={deleting} onClick={deleteRecord}>
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </Modal>
      )}
      {pending && (
        <Modal title="Discard unsaved scores?" onClose={() => setPending(null)}>
          <p className="modal-description">
            Your score register has unsaved edits. Stay here to save them, or discard them and
            continue.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setPending(null)}>
              Keep editing
            </button>
            <button
              className="button danger"
              onClick={() => {
                setDirty(false)
                setDraftVersion((value) => value + 1)
                pending.action()
                setPending(null)
              }}
            >
              Discard changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
