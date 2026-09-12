import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

export function ThresholdControl({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const valid =
    draft.trim() !== '' &&
    Number.isFinite(Number(draft)) &&
    Number(draft) >= 0 &&
    Number(draft) <= 100
  return (
    <form
      className="threshold-control"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) onChange(Number(draft))
      }}
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={15} />
        <label htmlFor="score-threshold">Score threshold</label>
      </div>
      <div className="threshold-input">
        <input
          id="score-threshold"
          aria-invalid={!valid}
          aria-describedby={!valid ? 'threshold-error' : undefined}
          type="number"
          min="0"
          max="100"
          step="any"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <span>%</span>
      </div>
      <button className="text-button" type="submit" disabled={!valid || Number(draft) === value}>
        Apply
      </button>
      {!valid && (
        <span className="field-error" id="threshold-error">
          Enter 0–100.
        </span>
      )}
    </form>
  )
}
