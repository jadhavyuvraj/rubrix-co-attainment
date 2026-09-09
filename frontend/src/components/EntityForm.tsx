import { useState, type FormEvent } from 'react'
import type { CO, Course, Student } from '../types'
import { Modal } from './ui'

export type Editor =
  | { kind: 'course'; record?: Course }
  | { kind: 'co'; record?: CO }
  | { kind: 'student'; record?: Student }

export function EntityForm({
  editor,
  onClose,
  onSave,
}: {
  editor: Editor
  onClose: () => void
  onSave: (data: Record<string, string | number>) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const label = editor.kind === 'co' ? 'course outcome' : editor.kind
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const data: Record<string, string | number> = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, String(value).trim()]),
    )
    if (editor.kind === 'course') data.semester = Number(data.semester)
    setBusy(true)
    setError('')
    try {
      await onSave(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={`${editor.record ? 'Edit' : 'Add'} ${label}`} onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {editor.kind === 'course' && (
            <>
              <label>
                Course name
                <input
                  name="name"
                  autoFocus
                  required
                  maxLength={120}
                  defaultValue={editor.record?.name}
                  placeholder="e.g. Database Management Systems"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  Course code
                  <input
                    name="code"
                    required
                    maxLength={20}
                    defaultValue={editor.record?.code}
                    placeholder="CS301"
                  />
                </label>
                <label>
                  Semester
                  <input
                    name="semester"
                    type="number"
                    required
                    min={1}
                    max={12}
                    defaultValue={editor.record?.semester ?? 5}
                  />
                </label>
              </div>
              <label>
                Department
                <input
                  name="department"
                  required
                  maxLength={100}
                  defaultValue={editor.record?.department ?? 'Computer Science & Engineering'}
                />
              </label>
              <label>
                Academic year
                <input
                  name="academic_year"
                  required
                  minLength={4}
                  maxLength={20}
                  defaultValue={editor.record?.academic_year ?? '2026–27'}
                />
              </label>
            </>
          )}
          {editor.kind === 'co' && (
            <>
              <label>
                Outcome code
                <input
                  name="code"
                  autoFocus
                  required
                  maxLength={20}
                  defaultValue={editor.record?.code}
                  placeholder="CO1"
                />
              </label>
              <label>
                Learning outcome
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  defaultValue={editor.record?.description}
                  placeholder="What should a student be able to do?"
                />
              </label>
            </>
          )}
          {editor.kind === 'student' && (
            <>
              <label>
                Student name
                <input
                  name="name"
                  autoFocus
                  required
                  maxLength={100}
                  defaultValue={editor.record?.name}
                  placeholder="e.g. Aarav Sharma"
                />
              </label>
              <label>
                Roll number
                <input
                  name="roll_number"
                  required
                  maxLength={30}
                  defaultValue={editor.record?.roll_number}
                  placeholder="CS23001"
                />
              </label>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              {busy ? 'Saving…' : editor.record ? 'Save changes' : `Add ${label}`}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
