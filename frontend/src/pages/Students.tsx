import { useState } from 'react'
import { ArrowDownAZ, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { CourseDetail, Student } from '../types'
import { EmptyState } from '../components/ui'

export function Students({
  course,
  onAdd,
  onEdit,
  onDelete,
}: {
  course: CourseDetail
  onAdd: () => void
  onEdit: (student: Student) => void
  onDelete: (student: Student) => void
}) {
  const [query, setQuery] = useState('')
  const [descending, setDescending] = useState(false)
  const students = course.students
    .filter((student) =>
      `${student.name} ${student.roll_number}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (descending ? -1 : 1) * a.name.localeCompare(b.name))
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>
            Enrolled students <span className="count-badge">{course.student_count}</span>
          </h2>
          <p>Students and their recorded outcomes in {course.code}.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={15} />
          Add student
        </button>
      </div>
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={15} />
          <input
            aria-label="Search enrolled students"
            placeholder="Search name or roll number…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          className="button secondary"
          aria-label={descending ? 'Sort names ascending' : 'Sort names descending'}
          onClick={() => setDescending((value) => !value)}
        >
          <ArrowDownAZ size={15} />
          {descending ? 'Z–A' : 'A–Z'}
        </button>
      </div>
      {!course.students.length ? (
        <EmptyState title="Your class is waiting">
          Add students to this course using their name and roll number.
        </EmptyState>
      ) : (
        <div className="table-scroll">
          <table className="score-table students-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>SCORES RECORDED</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-cell">
                      <div className={`student-avatar avatar-${index % 4}`}>
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <strong>{student.name}</strong>
                    </div>
                  </td>
                  <td className="roll-number">{student.roll_number}</td>
                  <td>
                    <span className="recorded-count">
                      {course.scores.filter((score) => score.student_id === student.id).length}
                      <span> / {course.co_count} outcomes</span>
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${student.name}`}
                        onClick={() => onEdit(student)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button delete"
                        aria-label={`Delete ${student.name}`}
                        onClick={() => onDelete(student)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr>
                  <td colSpan={4}>
                    <div className="p-8 text-center text-xs text-slate-500">
                      No students match “{query}”.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-footer">
        <span>Students are enrolled separately in each course.</span>
      </div>
    </section>
  )
}
