from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from .config import BACKEND_DIR, settings
from .database import initialize_database, make_engine
from .routers import courses, scores
from .schemas import HealthRead


def create_app(
    database_url: str | None = None,
    seed_demo: bool | None = None,
    frontend_dir: Path | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        engine = make_engine(database_url or settings.database_url)
        should_seed = settings.auto_seed if seed_demo is None else seed_demo
        initialize_database(engine, should_seed)
        app.state.session_factory = sessionmaker(bind=engine, expire_on_commit=False)
        try:
            yield
        finally:
            engine.dispose()

    app = FastAPI(title="Rubrix OBE API", version="1.0.0", lifespan=lifespan,
                  description="Course outcomes, student scores, and inclusive-threshold attainment. Scores are percentages from 0 to 100.")
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                       allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])

    @app.exception_handler(IntegrityError)
    async def conflict_handler(_: Request, __: IntegrityError):
        return JSONResponse(status_code=409, content={"detail": "A record with this code, roll number, or student/outcome pair already exists, or a related record is no longer available."})

    @app.get("/api/health", response_model=HealthRead, tags=["Health"])
    def health():
        return HealthRead(status="ok")

    app.include_router(courses.router)
    app.include_router(scores.router)
    frontend = frontend_dir or BACKEND_DIR.parent / "frontend" / "dist"
    if (frontend / "index.html").is_file():
        app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
    return app


app = create_app()
