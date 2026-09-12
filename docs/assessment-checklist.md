# Assessment checklist — RX-AF6E46

Reviewed against the Rubrix.ai Software Engineering Intern (Backend / Full Stack) Round 1 assessment on 12 September 2026.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Python 3.10+ and FastAPI | Complete | Python 3.11 local runtime; CI configured for 3.10, 3.11, and 3.12 |
| Course, CO, Student, Score CRUD | Complete | Nested API routers; browser create, edit, and delete workflow |
| Separate attainment function | Complete | `backend/app/services/attainment.py` |
| Inclusive threshold boundary | Verified | `[49.99, 50, 100]` at 50 produces 2 attained and 66.67%; API and browser boundary checks |
| Empty dataset | Verified | 0 evaluated, 0 attained, 0%; UI displays no scores |
| Database and relational integrity | Complete | SQLite, SQLAlchemy, foreign keys, uniqueness constraints, range validation and cascades |
| Pydantic requests and responses | Complete | `backend/app/schemas.py` |
| Swagger `/docs` renders | Verified | Browser test opens the rendered API documentation |
| React + Vite + Tailwind | Complete | TypeScript React frontend with Vite and Tailwind CSS |
| Selected course, outcomes and scores | Complete | Dashboard, course selector, score register, and outcome management |
| Results per CO | Complete | Percentage, threshold, evaluated and attained counts, chart and cards |
| Seed data | Complete | 3 courses × 4 COs; 8 student enrollments per course |
| Several readable commits | Complete | Original commits retained; review and submission changes added separately |
| README run instructions and limitations | Complete | Root README plus architecture reference |
| Correct reference code | Complete | `RX-AF6E46` in README and submission materials |
| GitHub repository | Created | [jadhavyuvraj/rubrix-co-attainment](https://github.com/jadhavyuvraj/rubrix-co-attainment) |
| JWT and faculty ownership | Deferred | Optional; explicitly documented in README |
| Docker Compose | Included; container untested | Multi-stage Dockerfile, Compose service, persistent volume, localhost binding and non-root user |

## Local verification

- **23 pytest tests passed.** The suite covers inclusive and fractional boundaries, zero/empty/all/none attainment, invalid thresholds, CRUD, duplicates, cross-course validation, atomic batch rejection, cascades, seed idempotency, UTC timestamps, and packaged static frontend serving.
- **4 Playwright browser tests passed.** They cover the seeded dashboard, responsive layout, CSV export, threshold updates, full CRUD, inline score validation, unsaved-change handling, save persistence, clearing scores, Swagger rendering, and a successful save followed by failed refresh.
- **Production build passed** with TypeScript checking and Vite asset generation.
- **Compose and workflow YAML parsed successfully.** Docker is unavailable locally, so no container-build result is claimed. GitHub Actions runs the Python matrix, frontend build, and browser tests on pushes; remote results are available in the repository's Actions tab.
- Two upstream Starlette deprecation warnings appear during pytest; they do not fail the tests.

The demo is intended for local assessment. Faculty authentication, deployment hardening, migrations and simultaneous-edit conflict handling remain future work. No submission recipient or portal was specified in the assessment text supplied here.
