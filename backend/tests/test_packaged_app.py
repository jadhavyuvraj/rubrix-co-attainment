from fastapi.testclient import TestClient

from app.main import create_app


def test_packaged_frontend_and_api_share_one_origin(tmp_path):
    frontend = tmp_path / "frontend"
    frontend.mkdir()
    (frontend / "index.html").write_text("<h1>Rubrix OBE</h1>", encoding="utf-8")
    (frontend / "app.js").write_text("window.appName = 'Rubrix OBE'", encoding="utf-8")
    with TestClient(create_app("sqlite://", seed_demo=True, frontend_dir=frontend)) as client:
        assert "Rubrix OBE" in client.get("/").text
        assert client.get("/app.js").status_code == 200
        assert len(client.get("/api/courses").json()) == 3
        assert client.get("/docs").status_code == 200
        assert client.get("/api/does-not-exist").status_code == 404
        assert client.get("/../app/main.py").status_code == 404


def test_score_timestamps_are_explicit_utc():
    with TestClient(create_app("sqlite://", seed_demo=True)) as client:
        course = client.get("/api/courses").json()[0]
        scores = client.get(f"/api/courses/{course['id']}/scores").json()
        assert all(score["updated_at"].endswith("Z") for score in scores)
