from datetime import datetime, timezone
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20, to_upper=True)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Percentage = Annotated[float, Field(ge=0, le=100, allow_inf_nan=False)]


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class CourseInput(Schema):
    code: Code
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    department: Name = "Computer Science & Engineering"
    semester: int = Field(default=5, ge=1, le=12)
    academic_year: Annotated[str, StringConstraints(strip_whitespace=True, min_length=4, max_length=20)] = "2026–27"


class CourseRead(CourseInput):
    id: int
    co_count: int
    student_count: int


class COInput(Schema):
    code: Code
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class CORead(COInput):
    id: int
    course_id: int


class StudentInput(Schema):
    roll_number: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30, to_upper=True)]
    name: Name


class StudentRead(StudentInput):
    id: int
    course_id: int


class ScoreInput(Schema):
    student_id: int = Field(gt=0)
    co_id: int = Field(gt=0)
    value: Percentage


class ScoreUpdate(Schema):
    value: Percentage


class ScoreRead(ScoreInput):
    id: int
    updated_at: datetime

    @field_validator("updated_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


class ScoreCell(Schema):
    student_id: int = Field(gt=0)
    co_id: int = Field(gt=0)
    value: Percentage | None


class ScoreBatch(Schema):
    scores: list[ScoreCell] = Field(max_length=5000)

    @field_validator("scores")
    @classmethod
    def unique_cells(cls, scores):
        pairs = [(score.student_id, score.co_id) for score in scores]
        if len(pairs) != len(set(pairs)):
            raise ValueError("Each student/outcome pair must appear only once.")
        return scores


class CourseDetail(CourseRead):
    cos: list[CORead]
    students: list[StudentRead]
    scores: list[ScoreRead]


class AttainmentRead(Schema):
    co: CORead
    threshold: Percentage
    total_students: int
    students_attained: int
    attainment_percentage: float


class HealthRead(Schema):
    status: str
