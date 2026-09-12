# Architecture and API

## Calculation and assumptions

```text
attainment (%) = count(recorded scores >= threshold) / count(recorded scores) × 100
```

`backend/app/services/attainment.py` contains the pure calculation function. Routes retrieve the scores and call it; the function has no HTTP or database dependencies.

- Scores and thresholds are percentages between 0 and 100, inclusive. Scores exactly equal to the threshold count using `>=`.
- For `[49.99, 50, 100]` at threshold `50`, two of three students attain: **66.67%**.
- Missing scores are excluded from the denominator. A recorded zero is included. Clearing a score cell deletes that score; it does not save zero.
- Empty data returns zero evaluated, zero attained, and 0% without division by zero. The UI displays **No scores / —** to distinguish this from an evaluated 0%.
- Results are rounded to two decimal places. The dashboard average is an unweighted mean of evaluated outcome percentages for the selected course.
- Status bands are Excellent ≥80%, Good ≥60% and <80%, and Needs attention <60%. Insights compare cohort attainment against a fixed 75% teaching benchmark. This is distinct from the adjustable score threshold used to evaluate individual students.
- A Student is a course enrollment. Its roll number is unique within that course. This deliberately small model avoids a separate institution-wide student registry.

## Architecture

```text
React views → typed fetch client → FastAPI routers → SQLAlchemy → SQLite
                                      ↓
                              attainment service
```

| Location | Responsibility |
| --- | --- |
| `backend/app/models.py` | Four relational entities, uniqueness constraints, score range check, cascading foreign keys |
| `backend/app/schemas.py` | Pydantic validation and response contracts |
| `backend/app/database.py` | Engine setup, SQLite foreign keys, request-scoped sessions |
| `backend/app/routers/` | Nested CRUD APIs, relationship validation, transaction boundaries |
| `backend/app/services/attainment.py` | Inclusive-threshold calculation |
| `backend/app/seed.py` | Deterministic, idempotent demo seed |
| `frontend/src/components/` | Reusable navigation, forms, chart, score table, dialog and feedback UI |
| `frontend/src/pages/` | Course, student and results views |
| `frontend/src/hooks/useWorkspace.ts` | Course selection, data loading, stale-response protection |
| `frontend/src/services/api.ts` | Configurable fetch client and API error handling |

A Course has many CourseOutcomes and Students. Each Score references one Student and one CourseOutcome, with a unique `(student_id, co_id)` pair. API writes reject cross-course relationships. SQLite foreign keys are enabled explicitly; deleting a course, outcome, or student removes its dependent scores. A batch score save validates every relationship first and commits all edits in one transaction.

The API uses 201 for creation, 204 for deletion, 404 for missing or out-of-course records, 409 for uniqueness conflicts, and 422 for invalid input. Updates use `PUT` with complete entity input. The score update body only needs `value`.

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET / POST | `/api/courses` | List or create courses; optional `search` on GET |
| GET / PUT / DELETE | `/api/courses/{id}` | Course detail, edit or delete |
| GET / POST | `/api/courses/{id}/cos` | Outcomes |
| GET / PUT / DELETE | `/api/courses/{id}/cos/{co_id}` | One outcome |
| GET / POST | `/api/courses/{id}/students` | Enrollments; optional `search` on GET |
| GET / PUT / DELETE | `/api/courses/{id}/students/{student_id}` | One student |
| GET / POST / PUT | `/api/courses/{id}/scores` | Read, create or batch upsert scores |
| GET / PUT / DELETE | `/api/courses/{id}/scores/{score_id}` | One score |
| GET | `/api/courses/{id}/cos/{co_id}/attainment?threshold=50` | One CO calculation |
| GET | `/api/courses/{id}/attainment?threshold=50` | All CO calculations |

Batch `PUT` accepts `{"scores":[{"student_id":1,"co_id":1,"value":50}]}`. A `null` value clears a cell. Duplicate pairs within a request are rejected.


