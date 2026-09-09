import { BookOpen, ChartNoAxesCombined, ChevronRight, GraduationCap, LayoutDashboard, Menu, Users, X } from 'lucide-react'
import { useState } from 'react'
import type { Page } from '../types'

const links = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'results', label: 'Results', icon: ChartNoAxesCombined },
] as const

export function Sidebar({ page, onNavigate, courseCount }: { page: Page; onNavigate: (page: Page) => void; courseCount: number }) {
  const [open, setOpen] = useState(false)
  return <>
    <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={22} /></button>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <a href="#dashboard" className="brand" onClick={event => { event.preventDefault(); onNavigate('dashboard'); setOpen(false) }}><span className="brand-mark"><span /><span /><span /><span /></span><span>rubrix<span className="brand-dot">.</span><small>OBE WORKSPACE</small></span></a>
      <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20} /></button>
      <div className="workspace-label">FACULTY WORKSPACE</div>
      <nav aria-label="Main navigation">{links.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={() => { onNavigate(id); setOpen(false) }}><Icon size={19} /><span>{label}</span>{id === 'courses' ? <span className="nav-count">{courseCount}</span> : page === id ? <ChevronRight size={16} /> : null}</button>)}</nav>
      <div className="sidebar-note"><span className="note-icon"><GraduationCap size={22} /></span><h3>Better learning.<br />Measurable outcomes.</h3><p>Every score tells a story.<br />Make yours count.</p><span className="note-line" /></div>
      <div className="sidebar-bottom"><div className="faculty-avatar">FW</div><div><strong>Faculty workspace</strong><span>Local demo · v1.0</span></div><span className="online-dot" /></div>
    </aside>
  </>
}
