import { ArrowDownRight, ArrowUpRight, Lightbulb } from 'lucide-react'
import type { Attainment } from '../types'
import { EmptyState, formatPercent } from './ui'

export function AttainmentChart({
  results,
  threshold,
}: {
  results: Attainment[]
  threshold: number
}) {
  const evaluated = results.filter((result) => result.total_students > 0)
  const sorted = [...evaluated].sort((a, b) => b.attainment_percentage - a.attainment_percentage)
  const best = sorted[0]
  const lowest = sorted.at(-1)
  const underTarget = evaluated.filter((result) => result.attainment_percentage < 75)
  return (
    <div className="analytics-grid">
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Attainment overview</h2>
            <p>Students meeting the {threshold}% score threshold</p>
          </div>
          <span className="chart-legend">
            <i />
            Attainment
          </span>
        </div>
        {evaluated.length ? (
          <div
            className="chart"
            role="img"
            aria-label={results
              .map(
                (result) =>
                  `${result.co.code}: ${result.total_students ? formatPercent(result.attainment_percentage) + '% attained' : 'no scores'}`,
              )
              .join(', ')}
          >
            <div className="chart-scale">
              {[100, 75, 50, 25, 0].map((value) => (
                <span key={value}>{value}%</span>
              ))}
            </div>
            <div className="plot">
              <div className="chart-grid">
                {[100, 75, 50, 25, 0].map((value) => (
                  <div key={value} />
                ))}
              </div>
              <div className="chart-bars">
                {results.map((result, index) => (
                  <div className="chart-column" key={result.co.id}>
                    <div className="bar-track">
                      <div
                        className={`bar bar-${index % 4}`}
                        style={{ height: `${result.attainment_percentage}%` }}
                      >
                        <span>
                          {result.total_students
                            ? `${formatPercent(result.attainment_percentage)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <span className="bar-label">{result.co.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Your results start with scores">
            Record student scores to see outcome attainment.
          </EmptyState>
        )}
        <div className="chart-foot">
          <span className="tiny-dot" />
          Equal to the threshold counts as attained.<span>Out of 100%</span>
        </div>
      </section>
      <aside className="insights-panel">
        <div className="flex items-center gap-2.5">
          <Lightbulb size={19} />
          <h2>Course insights</h2>
        </div>
        <p className="insights-sub">A little clarity for your next class.</p>
        {best && lowest ? (
          <>
            <div className="insight">
              <span className="insight-icon positive">
                <ArrowUpRight size={18} />
              </span>
              <div>
                <span>Strongest outcome</span>
                <strong>
                  {best.co.code} <em>{formatPercent(best.attainment_percentage)}%</em>
                </strong>
                <p>
                  {best.students_attained} of {best.total_students} evaluated students meet the
                  threshold.
                </p>
              </div>
            </div>
            <div className="insight">
              <span className="insight-icon amber">
                <ArrowDownRight size={18} />
              </span>
              <div>
                <span>Focus for improvement</span>
                <strong>
                  {lowest.co.code} <em>{formatPercent(lowest.attainment_percentage)}%</em>
                </strong>
                <p>
                  {lowest.total_students - lowest.students_attained
                    ? 'Revisit this outcome with students below the threshold.'
                    : 'All evaluated students meet this outcome.'}
                </p>
              </div>
            </div>
            <div className="insight-summary">
              {underTarget.length
                ? `${underTarget.length} outcome${underTarget.length === 1 ? '' : 's'} below the 75% cohort target.`
                : 'All evaluated outcomes meet the 75% cohort target.'}
              {results.length > evaluated.length &&
                ` ${results.length - evaluated.length} awaiting scores.`}
            </div>
          </>
        ) : (
          <p className="mt-8 text-sm leading-6">
            Add scores to identify strengths and outcomes that need more practice.
          </p>
        )}
      </aside>
    </div>
  )
}
