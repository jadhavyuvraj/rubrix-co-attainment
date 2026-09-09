from dataclasses import asdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models as m, schemas as s
from ..database import get_db
from ..services.attainment import calculate_co_attainment

router = APIRouter(prefix="/api/courses", tags=["Courses"])
DB = Annotated[Session, Depends(get_db)]
Threshold = Annotated[float, Query(ge=0, le=100, allow_inf_nan=False)]


def course_or_404(db: Session, course_id: int) -> m.Course:
    course = db.scalar(select(m.Course).where(m.Course.id == course_id).options(
        selectinload(m.Course.cos), selectinload(m.Course.students)))
    if course is None:
        raise HTTPException(404, "Course not found.")
    return course


def owned_or_404(db: Session, model, item_id: int, course_id: int):
    item = db.get(model, item_id)
    if item is None or item.course_id != course_id:
        raise HTTPException(404, "Record not found in this course.")
    return item


def course_scores(db: Session, course_id: int) -> list[m.Score]:
    return list(db.scalars(select(m.Score).join(m.CourseOutcome).where(
        m.CourseOutcome.course_id == course_id).order_by(m.Score.id)))


def save(db: Session, record):
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[s.CourseRead])
def list_courses(db: DB, search: str = ""):
    statement = select(m.Course).options(selectinload(m.Course.cos), selectinload(m.Course.students))
    if search.strip():
        statement = statement.where(m.Course.name.icontains(search.strip(), autoescape=True))
    return db.scalars(statement.order_by(m.Course.id)).all()


@router.post("", response_model=s.CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: s.CourseInput, db: DB):
    return save(db, m.Course(**payload.model_dump()))


@router.get("/{course_id}", response_model=s.CourseDetail)
def get_course(course_id: int, db: DB):
    course = course_or_404(db, course_id)
    return s.CourseDetail(**s.CourseRead.model_validate(course).model_dump(),
                          cos=sorted(course.cos, key=lambda co: co.code),
                          students=sorted(course.students, key=lambda student: student.roll_number),
                          scores=course_scores(db, course_id))


@router.put("/{course_id}", response_model=s.CourseRead)
def update_course(course_id: int, payload: s.CourseInput, db: DB):
    course = course_or_404(db, course_id)
    for key, value in payload.model_dump().items():
        setattr(course, key, value)
    return save(db, course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: DB):
    db.delete(course_or_404(db, course_id))
    db.commit()
    return Response(status_code=204)


@router.get("/{course_id}/cos", response_model=list[s.CORead], tags=["Course outcomes"])
def list_cos(course_id: int, db: DB):
    return sorted(course_or_404(db, course_id).cos, key=lambda co: co.code)


@router.post("/{course_id}/cos", response_model=s.CORead, status_code=201, tags=["Course outcomes"])
def create_co(course_id: int, payload: s.COInput, db: DB):
    course_or_404(db, course_id)
    return save(db, m.CourseOutcome(course_id=course_id, **payload.model_dump()))


@router.get("/{course_id}/cos/{co_id}", response_model=s.CORead, tags=["Course outcomes"])
def get_co(course_id: int, co_id: int, db: DB):
    return owned_or_404(db, m.CourseOutcome, co_id, course_id)


@router.put("/{course_id}/cos/{co_id}", response_model=s.CORead, tags=["Course outcomes"])
def update_co(course_id: int, co_id: int, payload: s.COInput, db: DB):
    co = owned_or_404(db, m.CourseOutcome, co_id, course_id)
    for key, value in payload.model_dump().items():
        setattr(co, key, value)
    return save(db, co)


@router.delete("/{course_id}/cos/{co_id}", status_code=204, tags=["Course outcomes"])
def delete_co(course_id: int, co_id: int, db: DB):
    db.delete(owned_or_404(db, m.CourseOutcome, co_id, course_id))
    db.commit()
    return Response(status_code=204)


@router.get("/{course_id}/students", response_model=list[s.StudentRead], tags=["Students"])
def list_students(course_id: int, db: DB, search: str = ""):
    course_or_404(db, course_id)
    statement = select(m.Student).where(m.Student.course_id == course_id)
    if search.strip():
        statement = statement.where(m.Student.name.icontains(search.strip(), autoescape=True))
    return db.scalars(statement.order_by(m.Student.roll_number)).all()


@router.post("/{course_id}/students", response_model=s.StudentRead, status_code=201, tags=["Students"])
def create_student(course_id: int, payload: s.StudentInput, db: DB):
    course_or_404(db, course_id)
    return save(db, m.Student(course_id=course_id, **payload.model_dump()))


@router.get("/{course_id}/students/{student_id}", response_model=s.StudentRead, tags=["Students"])
def get_student(course_id: int, student_id: int, db: DB):
    return owned_or_404(db, m.Student, student_id, course_id)


@router.put("/{course_id}/students/{student_id}", response_model=s.StudentRead, tags=["Students"])
def update_student(course_id: int, student_id: int, payload: s.StudentInput, db: DB):
    student = owned_or_404(db, m.Student, student_id, course_id)
    for key, value in payload.model_dump().items():
        setattr(student, key, value)
    return save(db, student)


@router.delete("/{course_id}/students/{student_id}", status_code=204, tags=["Students"])
def delete_student(course_id: int, student_id: int, db: DB):
    db.delete(owned_or_404(db, m.Student, student_id, course_id))
    db.commit()
    return Response(status_code=204)


@router.get("/{course_id}/attainment", response_model=list[s.AttainmentRead], tags=["Attainment"])
def course_attainment(course_id: int, db: DB, threshold: Threshold = 50):
    course = course_or_404(db, course_id)
    scores = course_scores(db, course_id)
    by_co: dict[int, list[float]] = {co.id: [] for co in course.cos}
    for score in scores:
        by_co[score.co_id].append(score.value)
    return [s.AttainmentRead(co=co, threshold=threshold,
                            **asdict(calculate_co_attainment(by_co[co.id], threshold)))
            for co in sorted(course.cos, key=lambda co: co.code)]


@router.get("/{course_id}/cos/{co_id}/attainment", response_model=s.AttainmentRead, tags=["Attainment"])
def co_attainment(course_id: int, co_id: int, db: DB, threshold: Threshold = 50):
    co = owned_or_404(db, m.CourseOutcome, co_id, course_id)
    scores = db.scalars(select(m.Score.value).where(m.Score.co_id == co_id))
    return s.AttainmentRead(co=co, threshold=threshold, **asdict(calculate_co_attainment(scores, threshold)))

