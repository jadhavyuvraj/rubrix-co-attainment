import { ArrowRight, BookOpen, Layers3, Pencil, Plus, Trash2, Users } from 'lucide-react'
import type { CO, Course, CourseDetail } from '../types'
import { EmptyState } from '../components/ui'

export function Courses({
  courses,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  courses: Course[]
  selectedId: number | null
  onSelect: (id: number) => void
  onAdd: () => void
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
}) {
  return (
    <section className="mb-7">
      <div className="section-heading first">
        <div>
          <h2>
            Your courses <span className="count-badge">{courses.length}</span>
          </h2>
          <p>Select a course to manage its outcomes and scores.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={15} />
          Add course
        </button>
      </div>
      {!courses.length ? (
        <EmptyState title="Create your first course">
          Start with a course name and code. Add outcomes and students next.
        </EmptyState>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <article
              className={`panel course-card ${course.id === selectedId ? 'selected' : ''}`}
              key={course.id}
            >
              <div className="flex justify-between items-center">
                <span className="course-code">
                  <BookOpen size={15} />
                  {course.code}
                </span>
                <div className="flex">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${course.name}`}
                    onClick={() => onEdit(course)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button delete"
                    aria-label={`Delete ${course.name}`}
                    onClick={() => onDelete(course)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3>{course.name}</h3>
              <p>
                Semester {course.semester} <span>·</span> {course.academic_year}
              </p>
              <div className="course-card-bottom">
                <span>
                  <Users size={13} />
                  {course.student_count}
                  <Layers3 size={13} />
                  {course.co_count}
                </span>
                <button className="text-button" onClick={() => onSelect(course.id)}>
                  {course.id === selectedId ? 'Selected' : 'Open course'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function Outcomes({
  course,
  onAdd,
  onEdit,
  onDelete,
}: {
  course: CourseDetail
  onAdd: () => void
  onEdit: (co: CO) => void
  onDelete: (co: CO) => void
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>
            Course outcomes <span className="count-badge">{course.cos.length}</span>
          </h2>
          <p>Define the skills your students should demonstrate.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={15} />
          Add outcome
        </button>
      </div>
      {course.cos.length ? (
        <div className="outcomes-list">
          {course.cos.map((co) => (
            <div className="outcome-row" key={co.id}>
              <span className="co-tag">{co.code}</span>
              <p>{co.description}</p>
              <div className="flex shrink-0">
                <button
                  className="icon-button"
                  aria-label={`Edit ${co.code}`}
                  onClick={() => onEdit(co)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button delete"
                  aria-label={`Delete ${co.code}`}
                  onClick={() => onDelete(co)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="What will students learn?">
          Add your first course outcome to start measuring attainment.
        </EmptyState>
      )}
    </section>
  )
}
