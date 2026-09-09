import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowUpRight, CheckCircle2, CircleAlert, Inbox, X } from 'lucide-react'
import type { Notice } from '../types'

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Inbox size={25} /></div><h3>{title}</h3><p>{children}</p>{action}</div>
}

export function LoadingSkeleton() {
  return <div className="space-y-5 animate-pulse" role="status" aria-label="Loading course data"><div className="h-24 rounded-2xl bg-slate-200/60" /><div className="h-80 rounded-2xl bg-slate-200/60" /><span className="sr-only">Loading course data</span></div>
}

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement
    ref.current?.showModal()
    return () => { previousFocus.current?.focus() }
  }, [])
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="modal-head"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={20} /></button></div>
    {children}
  </dialog>
}

export function Toast({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(onClose, notice.type === 'error' ? 9000 : 4500)
    return () => window.clearTimeout(timer)
  }, [notice, onClose])
  if (!notice) return null
  return <div className={`toast ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
    {notice.type === 'success' ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}<span>{notice.message}</span>
    <button onClick={onClose} className="icon-button" aria-label="Dismiss notification"><X size={17} /></button>
  </div>
}

export function StatCard({ label, value, detail, icon, accent = false }: { label: string; value: ReactNode; detail: string; icon: ReactNode; accent?: boolean }) {
  return <article className={`stat-card ${accent ? 'accent' : ''}`}><div className="flex items-center justify-between"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-detail">{accent && <ArrowUpRight size={14} />}{detail}</div></article>
}

export function statusFor(value: number, evaluated: number) {
  if (!evaluated) return { label: 'No scores', tone: 'neutral' }
  if (value >= 80) return { label: 'Excellent', tone: 'excellent' }
  if (value >= 60) return { label: 'Good', tone: 'good' }
  return { label: 'Needs attention', tone: 'attention' }
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
}
