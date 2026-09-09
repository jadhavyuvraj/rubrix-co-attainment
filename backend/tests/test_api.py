import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import create_app
from app.models import CourseOutcome, Score, Student


@pytest.fixture
def client():
    with TestClient(create_app("sqlite://", seed_demo=False)) as client:
        yield client


def create_course(client, code="CS101"):
    response = client.post("/api/courses", json={"code": code, "name": "Test course"})
    assert response.status_code == 201
    return response.json()["id"]


def records(client):
    course = create_course(client)
    base = f"/api/courses/{course}"
    co = client.post(f"{base}/cos", json={"code": "CO1", "description": "Write SQL"}).json()
    student = client.post(f"{base}/students", json={"name": "Aarav", "roll_number": "CS001"}).json()
    return base, co, student


def test_score_crud_and_attainment_boundary(client):
    base, co, student = records(client)
    payload = {"co_id": co["id"], "student_id": student["id"], "value": 50}
    response = client.post(f"{base}/scores", json=payload)
    assert response.status_code == 201
    score_id = response.json()["id"]
    assert client.get(f"{base}/scores/{score_id}").json()["value"] == 50
    result = client.get(f"{base}/cos/{co['id']}/attainment?threshold=50").json()
    assert (result["students_attained"], result["attainment_percentage"]) == (1, 100)
    assert client.get(f"{base}/attainment?threshold=50.01").json()[0]["attainment_percentage"] == 0
    assert client.put(f"{base}/scores/{score_id}", json={"value": 80}).json()["value"] == 80
    assert client.delete(f"{base}/scores/{score_id}").status_code == 204
    assert client.get(f"{base}/attainment").json()[0]["total_students"] == 0


def test_duplicates_validation_and_missing_records(client):
    base, co, student = records(client)
    assert client.post("/api/courses", json={"code": "cs101", "name": "Duplicate"}).status_code == 409
    assert client.post(f"{base}/cos", json={"code": "CO1", "description": "Duplicate"}).status_code == 409
    assert client.post(f"{base}/students", json={"name": "Duplicate", "roll_number": "CS001"}).status_code == 409
    assert client.post("/api/courses", json={"code": "  ", "name": "Blank"}).status_code == 422
    assert client.get("/api/courses/999").status_code == 404
    payload = {"co_id": co["id"], "student_id": student["id"], "value": 101}
    assert client.post(f"{base}/scores", json=payload).status_code == 422
    payload["value"] = 50
    assert client.post(f"{base}/scores", json=payload).status_code == 201
    assert client.post(f"{base}/scores", json=payload).status_code == 409
    assert client.get(f"{base}/attainment?threshold=-1").status_code == 422
    assert client.get(f"{base}/attainment?threshold=nan").status_code == 422


def test_cross_course_records_and_atomic_batch(client):
    base, co, student = records(client)
    other = create_course(client, "CS202")
    foreign = client.post(f"/api/courses/{other}/students", json={"name": "Other", "roll_number": "CS002"}).json()
    valid = {"co_id": co["id"], "student_id": student["id"], "value": 50}
    invalid = {**valid, "student_id": foreign["id"]}
    assert client.post(f"{base}/scores", json=invalid).status_code == 404
    assert client.put(f"{base}/scores", json={"scores": [valid, invalid]}).status_code == 422
    assert client.get(f"{base}/scores").json() == []
    assert client.put(f"{base}/scores", json={"scores": [valid, valid]}).status_code == 422
    assert client.put(f"{base}/scores", json={"scores": [valid]}).status_code == 200
    assert len(client.get(f"{base}/scores").json()) == 1
    assert client.put(f"{base}/scores", json={"scores": [{**valid, "value": None}]}).json() == []


def test_crud_and_cascade(client):
    base, co, student = records(client)
    assert client.put(base, json={"code": "CS101", "name": "Renamed"}).json()["name"] == "Renamed"
    assert client.put(f"{base}/cos/{co['id']}", json={"code": "CO2", "description": "Normalize schemas"}).json()["code"] == "CO2"
    assert client.put(f"{base}/students/{student['id']}", json={"name": "Updated", "roll_number": "CS001"}).json()["name"] == "Updated"
    client.post(f"{base}/scores", json={"co_id": co["id"], "student_id": student["id"], "value": 75})
    assert client.delete(base).status_code == 204
    with client.app.state.session_factory() as db:
        for model in (Student, CourseOutcome, Score):
            assert db.scalar(select(func.count()).select_from(model)) == 0


def test_missing_scores_are_excluded_but_zero_counts(client):
    base, co, student = records(client)
    client.post(f"{base}/students", json={"name": "Unscored", "roll_number": "CS002"})
    client.post(f"{base}/scores", json={"co_id": co["id"], "student_id": student["id"], "value": 0})
    result = client.get(f"{base}/attainment?threshold=0").json()[0]
    assert result["total_students"] == 1
    assert result["students_attained"] == 1


def test_seed_docs_and_restart(tmp_path):
    url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    with TestClient(create_app(url, seed_demo=True)) as client:
        courses = client.get("/api/courses").json()
        assert len(courses) == 3
        assert all(course["co_count"] == 4 and course["student_count"] == 8 for course in courses)
        assert client.get("/docs").status_code == 200
        assert "openapi" in client.get("/openapi.json").json()
        assert client.get("/api/health").json() == {"status": "ok"}
        for course in courses:
            client.delete(f"/api/courses/{course['id']}")
    with TestClient(create_app(url, seed_demo=True)) as client:
        assert client.get("/api/courses").json() == []
