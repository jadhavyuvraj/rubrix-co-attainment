import type { Attainment, Course, CourseDetail } from '../types'

const base = ((import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const detail = data?.detail
    throw new Error(typeof detail === 'string' ? detail : Array.isArray(detail)
      ? detail.map((item: { msg: string }) => item.msg).join(' ')
      : 'Could not reach the server. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  courses: () => request<Course[]>('/courses'),
  course: (id: number) => request<CourseDetail>(`/courses/${id}`),
  attainment: (id: number, threshold: number) => request<Attainment[]>(`/courses/${id}/attainment?threshold=${threshold}`),
  save: <T,>(path: string, value: unknown, method = 'POST') => request<T>(path, { method, body: JSON.stringify(value) }),
  remove: (path: string) => request<void>(path, { method: 'DELETE' }),
}

