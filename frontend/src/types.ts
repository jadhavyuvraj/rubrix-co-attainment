export interface Course {
  id: number
  code: string
  name: string
  department: string
  semester: number
  academic_year: string
  co_count: number
  student_count: number
}

export interface CO {
  id: number
  course_id: number
  code: string
  description: string
}

export interface Student {
  id: number
  course_id: number
  name: string
  roll_number: string
}

export interface Score {
  id: number
  student_id: number
  co_id: number
  value: number
  updated_at: string
}

export interface CourseDetail extends Course {
  cos: CO[]
  students: Student[]
  scores: Score[]
}

export interface Attainment {
  co: CO
  threshold: number
  total_students: number
  students_attained: number
  attainment_percentage: number
}

export type Page = 'dashboard' | 'courses' | 'students' | 'results'
export type Tab = 'overview' | 'scores' | 'outcomes'
export type Notice = { type: 'success' | 'error'; message: string }
