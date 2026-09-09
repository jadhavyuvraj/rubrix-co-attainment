import { useCallback, useState } from 'react'
import { ArrowRight, BookOpen, ChevronRight, GraduationCap, Layers3, Plus, TrendingUp, Users } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { StatCard, LoadingSkeleton, EmptyState, Toast, formatPercent } from './components/ui'
import { AttainmentChart } from './components/AttainmentChart'
import { ThresholdControl } from './components/ThresholdControl'
import { useWorkspace } from './hooks/useWorkspace'
import type { Notice, Page, Tab } from './types'

export default function App() {
  const workspace = useWorkspace()
  const { courses, selectedId, setSelectedId, detail, results, threshold, setThreshold, loading, error } = workspace
  const [page, setPage] = useState<Page>('dashboard')
  const [tab, setTab] = useState<Tab>('overview')
  const [notice, setNotice] = useState<Notice | null>(null)
  const dismiss = useCallback(() => setNotice(null), [])
  const evaluated = results.filter(result => result.total_students > 0)
  const average = evaluated.length ? evaluated.reduce((sum, result) => sum + result.attainment_percentage, 0) / evaluated.length : null
  return <div className="app-shell">
    <Sidebar page={page} onNavigate={setPage} courseCount={courses.length} />
    <main className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{page.charAt(0).toUpperCase() + page.slice(1)}</strong></div><div className="topbar-right"><span className="term-pill"><span className="online-dot" />Academic year {detail?.academic_year || '2026–27'}</span><span className="header-divider" /><div className="header-avatar"><GraduationCap size={20} /></div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">OUTCOME-BASED EDUCATION</div><h1>Course attainment<span>.</span></h1><p>Turn student performance into meaningful learning insights.</p></div><button className="button secondary" onClick={() => { setPage('courses'); setTab('outcomes') }}><BookOpen size={17} />Manage courses<ArrowRight size={15} /></button></div>
        <section className="stats-grid" aria-label="Workspace statistics">
          <StatCard label="Total courses" value={String(courses.length).padStart(2, '0')} detail="Across your workspace" icon={<BookOpen size={18} />} />
          <StatCard label="Course outcomes" value={courses.reduce((sum, course) => sum + course.co_count, 0)} detail="Defined learning objectives" icon={<Layers3 size={18} />} />
          <StatCard label="Student enrollments" value={courses.reduce((sum, course) => sum + course.student_count, 0)} detail="Counted once per course" icon={<Users size={18} />} />
          <StatCard label="Average attainment" value={average === null ? '—' : <>{formatPercent(average)}<small>%</small></>} detail="Selected course · evaluated COs" icon={<TrendingUp size={18} />} accent />
        </section>
        <section className="course-strip"><div className="course-icon"><BookOpen size={24} /></div><div className="course-select-wrap"><label htmlFor="selected-course">CURRENT COURSE</label><select id="selected-course" value={selectedId ?? ''} onChange={event => setSelectedId(Number(event.target.value))}>{!courses.length && <option value="">No courses yet</option>}{courses.map(course => <option value={course.id} key={course.id}>{course.name}</option>)}</select><div className="course-meta">{detail && <><span>{detail.code}</span><i />Semester {detail.semester}<i />{detail.department}</>}</div></div><div className="course-strip-count"><Users size={16} />{detail?.student_count ?? 0} students<span /><Layers3 size={16} />{detail?.co_count ?? 0} outcomes</div></section>
        <div className="workspace-toolbar"><div className="tabs" role="tablist" aria-label="Course views">{(['overview', 'scores', 'outcomes'] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value === 'overview' ? 'Overview' : value === 'scores' ? 'Score register' : 'Course outcomes'}</button>)}</div><ThresholdControl value={threshold} onChange={setThreshold} /></div>
        {error ? <div className="error-panel" role="alert"><h3>Couldn’t load your workspace</h3><p>{error}</p><button className="button secondary" onClick={() => workspace.refreshCourses().catch(err => setNotice({ type: 'error', message: err.message }))}>Try again</button></div> : loading ? <LoadingSkeleton /> : !detail ? <EmptyState title="A fresh start for your course">Create your first course to define outcomes and record scores.</EmptyState> : <><AttainmentChart results={results} threshold={threshold} /><section className="panel mt-6"><div className="panel-heading"><div><h2>Your course outcomes</h2><p>{detail.co_count} learning objectives for {detail.code}</p></div><button className="text-button" onClick={() => setTab('outcomes')}>View all<ArrowRight size={15} /></button></div><div className="outcome-preview">{detail.cos.map(co => <div key={co.id}><span className="co-tag">{co.code}</span><p>{co.description}</p><ChevronRight size={16} /></div>)}</div></section></>}
        <footer className="page-footer"><span><span className="footer-brand">rubrix.</span> Institutional excellence, one outcome at a time.</span><span>OBE Workspace <span className="footer-dot">·</span> v1.0</span></footer>
      </div>
    </main>
    <Toast notice={notice} onClose={dismiss} />
  </div>
}
