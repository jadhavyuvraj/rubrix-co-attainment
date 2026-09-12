import pytest
from sqlalchemy import select

from app.database import initialize_database, make_engine
from app.models import Course


@pytest.mark.parametrize("scheme", ["postgres", "postgresql", "postgresql+psycopg"])
def test_hosted_postgres_urls_select_the_installed_driver(scheme):
    engine = make_engine(f"{scheme}://user:password@localhost/rubrix?sslmode=require")
    assert engine.url.drivername == "postgresql+psycopg"
    assert engine.url.query["sslmode"] == "require"
    engine.dispose()


def test_nested_sqlite_path_and_restart_preserve_deletions(tmp_path):
    path = tmp_path / "nested" / "rubrix.db"
    engine = make_engine(f"sqlite:///{path.as_posix()}")
    initialize_database(engine, seed_demo=True)
    with engine.begin() as connection:
        assert len(connection.execute(select(Course)).all()) == 3
        connection.execute(Course.__table__.delete())
    engine.dispose()
    restarted = make_engine(f"sqlite:///{path.as_posix()}")
    initialize_database(restarted, seed_demo=True)
    with restarted.connect() as connection:
        assert connection.execute(select(Course)).all() == []
    restarted.dispose()
