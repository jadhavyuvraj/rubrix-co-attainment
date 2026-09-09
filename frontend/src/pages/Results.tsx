import { Download, TrendingUp } from 'lucide-react'
import type { Attainment, CourseDetail } from '../types'
import { AttainmentChart } from '../components/AttainmentChart'
import { EmptyState, formatPercent, statusFor } from '../components/ui'

function csvValue(value: string | number) {
  const text = String(value)
  return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`
}

export function Results({
  course,
  results,
  threshold,
}: {
  course: CourseDetail
  results: Attainment[]
  threshold: number
}) {
  function exportCSV() {
    const rows = [
      [
        'Course',
        'Outcome',
        'Description',
        'Score threshold (%)',
        'Students evaluated',
        'Students attained',
        'Attainment (%)',
      ],
      ...results.map((result) => [
        course.code,
        result.co.code,
        result.co.description,
        result.threshold,
        result.total_students,
        result.students_attained,
        result.attainment_percentage,
      ]),
    ]
    const blob = new Blob(
      ['\uFEFF' + rows.map((row) => row.map(csvValue).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8;' },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${course.code.replace(/[^a-z0-9-]/gi, '_')}-attainment-${threshold}.csv`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (!results.length)
    return (
      <EmptyState title="No outcomes to calculate yet">
        Define course outcomes and record scores to see your results.
      </EmptyState>
    )
  return (
    <>
      <AttainmentChart results={results} threshold={threshold} />
      <div className="section-heading">
        <div>
          <h2>Outcome breakdown</h2>
          <p>Calculated from saved scores at a {threshold}% score threshold.</p>
        </div>
        <button className="button secondary" onClick={exportCSV}>
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <div className="results-grid">
        {results.map((result) => {
          const status = statusFor(result.attainment_percentage, result.total_students)
          return (
            <article className="panel result-card" key={result.co.id}>
              <div className="flex justify-between items-center gap-2">
                <span className="co-tag">{result.co.code}</span>
                <span className={`status-badge ${status.tone}`}>{status.label}</span>
              </div>
              <p className="result-description">{result.co.description}</p>
              <div className="result-number">
                {result.total_students ? (
                  <>
                    {formatPercent(result.attainment_percentage)}
                    <small>%</small>
                  </>
                ) : (
                  '—'
                )}
                <TrendingUp size={19} />
              </div>
              <div
                className={`attainment-progress ${status.tone}`}
                role="progressbar"
                aria-label={`${result.co.code} attainment`}
                aria-valuenow={result.attainment_percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${result.attainment_percentage}%` }} />
              </div>
              <div className="result-details">
                <span>
                  <strong>{result.students_attained}</strong> attained
                </span>
                <span>
                  <strong>{result.total_students}</strong> evaluated
                </span>
              </div>
              <div className="result-threshold">
                Score threshold ≥ {result.threshold}%
                <span>{course.students.length - result.total_students} unscored</span>
              </div>
            </article>
          )
        })}
      </div>
      <div className="method-note">
        <strong>How to read these results</strong>
        <p>
          Attainment = students scoring ≥ {threshold}% ÷ students with a recorded score × 100. An
          empty outcome returns 0% in the API and is displayed as “No scores” here. Average
          attainment excludes outcomes with no scores.
        </p>
        <div className="status-key">
          <span>
            <i className="excellent" />
            Excellent: 80–100%
          </span>
          <span>
            <i className="good" />
            Good: 60–&lt;80%
          </span>
          <span>
            <i className="attention" />
            Needs attention: &lt;60%
          </span>
        </div>
        <p>
          The 75% cohort target in insights is a fixed teaching benchmark, separate from the student
          score threshold.
        </p>
      </div>
    </>
  )
}
