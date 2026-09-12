import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import type { Attainment, Course, CourseDetail } from '../types'

export function useWorkspace() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<CourseDetail | null>(null)
  const [results, setResults] = useState<Attainment[]>([])
  const [threshold, setThreshold] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const sequence = useRef(0)

  const refreshCourses = useCallback(async (preferredId?: number) => {
    const data = await api.courses()
    setError('')
    setCourses(data)
    setSelectedId((current) =>
      data.some((course) => course.id === (preferredId ?? current))
        ? (preferredId ?? current)
        : (data[0]?.id ?? null),
    )
    setRevision((value) => value + 1)
  }, [])

  useEffect(() => {
    refreshCourses().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refreshCourses])

  useEffect(() => {
    const current = ++sequence.current
    if (selectedId === null) {
      setDetail(null)
      setResults([])
      if (revision) setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    setDetail(null)
    setResults([])
    Promise.all([api.course(selectedId), api.attainment(selectedId, threshold)])
      .then(([course, values]) => {
        if (current !== sequence.current) return
        setDetail(course)
        setResults(values)
      })
      .catch((err) => {
        if (current === sequence.current) setError(err.message)
      })
      .finally(() => {
        if (current === sequence.current) setLoading(false)
      })
    return () => {
      sequence.current += 1
    }
  }, [selectedId, threshold, revision])

  return {
    courses,
    selectedId,
    setSelectedId,
    detail,
    results,
    threshold,
    setThreshold,
    loading,
    error,
    refreshCourses,
  }
}
