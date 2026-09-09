from fastapi import APIRouter, HTTPException, Response

from .. import models as m, schemas as s
from .courses import DB, course_or_404, course_scores, owned_or_404, save

router = APIRouter(prefix="/api/courses/{course_id}/scores", tags=["Scores"])


def score_or_404(db, course_id, score_id):
    score = db.get(m.Score, score_id)
    if score is None:
        raise HTTPException(404, "Score not found.")
    owned_or_404(db, m.CourseOutcome, score.co_id, course_id)
    return score


@router.get("", response_model=list[s.ScoreRead])
def list_scores(course_id: int, db: DB):
    course_or_404(db, course_id)
    return course_scores(db, course_id)


@router.post("", response_model=s.ScoreRead, status_code=201)
def create_score(course_id: int, payload: s.ScoreInput, db: DB):
    owned_or_404(db, m.Student, payload.student_id, course_id)
    owned_or_404(db, m.CourseOutcome, payload.co_id, course_id)
    return save(db, m.Score(**payload.model_dump()))


@router.put("", response_model=list[s.ScoreRead], summary="Save score cells atomically; null clears a score")
def save_scores(course_id: int, payload: s.ScoreBatch, db: DB):
    course = course_or_404(db, course_id)
    student_ids = {student.id for student in course.students}
    co_ids = {co.id for co in course.cos}
    if any(cell.student_id not in student_ids or cell.co_id not in co_ids for cell in payload.scores):
        raise HTTPException(422, "Every student and outcome must belong to the selected course.")
    existing = {(score.student_id, score.co_id): score for score in course_scores(db, course_id)}
    for cell in payload.scores:
        score = existing.get((cell.student_id, cell.co_id))
        if cell.value is None:
            if score is not None:
                db.delete(score)
        elif score is not None:
            score.value = cell.value
        else:
            db.add(m.Score(**cell.model_dump()))
    db.commit()
    return course_scores(db, course_id)


@router.get("/{score_id}", response_model=s.ScoreRead)
def get_score(course_id: int, score_id: int, db: DB):
    return score_or_404(db, course_id, score_id)


@router.put("/{score_id}", response_model=s.ScoreRead)
def update_score(course_id: int, score_id: int, payload: s.ScoreUpdate, db: DB):
    score = score_or_404(db, course_id, score_id)
    score.value = payload.value
    return save(db, score)


@router.delete("/{score_id}", status_code=204)
def delete_score(course_id: int, score_id: int, db: DB):
    db.delete(score_or_404(db, course_id, score_id))
    db.commit()
    return Response(status_code=204)

