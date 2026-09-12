# Rubrix OBE · CO Attainment Calculator

**Rubrix.ai Software Engineering Intern assessment — reference `RX-AF6E46`**

**GitHub username:** `jadhavyuvraj`

**Repository:** [jadhavyuvraj/rubrix-co-attainment](https://github.com/jadhavyuvraj/rubrix-co-attainment)

A complete local faculty workspace built with **Python, FastAPI, SQLAlchemy, SQLite, Pydantic, React, TypeScript, Vite, and Tailwind CSS**. Define outcomes, record student scores, and calculate attainment with an inclusive threshold.

![Rubrix OBE dashboard](docs/dashboard.png)

## Run locally

Requires Python **3.10+** and Node.js **22 LTS**. Run these commands from the repository root. No database server or `.env` file is required.

**Windows PowerShell — terminal 1:**

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-cache-dir -r backend\requirements.lock.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2:**

```powershell
cd frontend
npm ci
npm run dev
```

**macOS/Linux — terminal 1:**

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock.txt
cd backend
../.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend with the same three terminal-2 commands above.

- **App:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Swagger API docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **OpenAPI schema:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

Stop servers with `Ctrl+C`. VS Code tasks and launch configurations are included: open the repository, install dependencies, then choose **Terminal → Run Task → Start Rubrix**. On macOS/Linux, select `.venv/bin/python` as the interpreter. Do not start a second server on an occupied port.

### Docker Compose

With Docker installed, run from the repository root:

```bash
docker compose up --build
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080); API docs are at `/docs` on the same address. A multi-stage image builds React and serves its production assets through FastAPI. SQLite persists in the `rubrix-data` volume. `docker compose down` stops the app without deleting that data.

The container runs as a non-root user and binds only to localhost. Docker is not installed in the development environment, so the container build itself has not been run here. The equivalent production frontend and API serving path is covered by a test.

## Features

- Course, CO, Student, and Score CRUD with typed API contracts and database constraints.
- Three seeded courses, four COs per course, and eight students enrolled in each course.
- Course dashboard, editable score register, outcome/student management, search and sorting.
- Atomic score saves, 0–100 validation, explicit missing scores, unsaved-edit protection, last-saved indicator, and deletion confirmations.
- Adjustable threshold, results for each CO, attainment charts, teaching insights, and CSV export.
- Responsive navigation and tables, keyboard focus states, loading/empty/error states, and notification feedback.

## The calculation

```text
attainment (%) = count(recorded scores >= threshold) / count(recorded scores) × 100
```

The pure function lives in [`backend/app/services/attainment.py`](backend/app/services/attainment.py), independently of routes and database code. **A score equal to the threshold counts using `>=`.** For `[49.99, 50, 100]` at `50`, the result is **66.67%**.

Missing scores are excluded; a recorded zero is included. Clearing a cell removes the score. No scores returns 0 evaluated and 0% from the API; the UI displays “No scores” to distinguish it from measured failure. Results are rounded to two decimal places. Average attainment is the unweighted mean of evaluated CO results.

Status bands: Excellent ≥80%, Good ≥60% and <80%, Needs attention <60%. The insights panel's fixed 75% cohort target is separate from the configurable student score threshold.

## Model and architecture

```text
React components → fetch client → FastAPI routers → SQLAlchemy → SQLite
                                      ↓
                               attainment service
```

A Course has many COs and Students. A Score belongs to one Student and one CO, with a unique student/CO pair. Writes reject records from different courses. SQLite foreign keys and cascades are enabled. A Student represents a course enrollment, so eight demo people across three courses appear as **24 enrollments**, not 24 unique people.

Routes use request-scoped database sessions, 201 on creation, 204 on deletion, 404 for missing records, 409 for duplicates, and 422 for invalid input. [Architecture and endpoint reference](docs/architecture.md) explains the module boundaries and API in more detail.

## Seed and configuration

First startup creates `backend/data/rubrix.db` and seeds the demo. Later startups preserve edits and deletions. From `backend/`, `python -m app.seed` using the virtual environment seeds an empty database and leaves existing courses unchanged.

The two `.env.example` files document optional configuration. Backend: `DATABASE_URL`, `AUTO_SEED`, `CORS_ORIGINS`. Frontend: `VITE_API_URL`, `API_PROXY_TARGET`. Defaults connect the Vite frontend to the local backend. Set `AUTO_SEED=false` before first startup for an empty workspace.

## Verification

From `backend/` with the virtual environment:

```powershell
..\.venv\Scripts\python.exe -m pytest -q
```

From `frontend/`:

```powershell
npm run build
npm run test:e2e
```

Use `../.venv/bin/python` on macOS/Linux. Browser tests use installed Chrome by default; set `PLAYWRIGHT_CHANNEL=chromium` after `npx playwright install chromium` to use Playwright's browser. Test courses are cleaned up without changing seeded data.

See [the assessment checklist](docs/assessment-checklist.md) for the latest verified results and exact coverage. Python dependency versions are captured in `requirements.lock.txt`, and npm versions in `package-lock.json`. The official `esbuild-wasm` npm alias keeps the Vite compiler working in the development Windows sandbox.

## Deliberate limits

JWT login and server-side faculty ownership are **not implemented**; they are optional in the brief. The core works without credentials. This is a local assessment app, not a public multi-user service. Also deferred: migrations, concurrent-edit conflict detection, pagination, CSV import, and an institution-wide student registry.

With more time, I would add faculty ownership with isolation tests, Alembic migrations, then optimistic concurrency and a wider accessibility audit. Source code contains no comments, as requested. The implementation uses AI assistance; its calculation, transaction boundaries, enrollment model, and tradeoffs are documented for a technical walkthrough.
