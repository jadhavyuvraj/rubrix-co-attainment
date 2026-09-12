from collections.abc import Generator
from pathlib import Path

from fastapi import Request
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str):
    parsed = make_url(url)
    if parsed.drivername in ("postgres", "postgresql"):
        parsed = parsed.set(drivername="postgresql+psycopg")
    sqlite = parsed.get_backend_name() == "sqlite"
    options = {"connect_args": {"check_same_thread": False}} if sqlite else {
        "pool_pre_ping": True,
        "pool_size": 2,
        "max_overflow": 3,
    }
    if sqlite and parsed.database not in (None, "", ":memory:"):
        Path(parsed.database).parent.mkdir(parents=True, exist_ok=True)
    if sqlite and parsed.database in (None, "", ":memory:"):
        options["poolclass"] = StaticPool
    if parsed.drivername == "postgresql+psycopg":
        options["connect_args"] = {"connect_timeout": 15, "prepare_threshold": None}
    engine = create_engine(parsed, **options)
    if sqlite:
        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
    return engine


def initialize_database(engine, seed_demo: bool):
    from .seed import seed_database

    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(74646)"))
        fresh = not inspect(connection).has_table("courses")
        Base.metadata.create_all(connection)
        if fresh and seed_demo:
            with Session(bind=connection) as session:
                seed_database(session)


def get_db(request: Request) -> Generator[Session, None, None]:
    with request.app.state.session_factory() as session:
        yield session
