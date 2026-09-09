from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    department: Mapped[str] = mapped_column(String(100))
    semester: Mapped[int]
    academic_year: Mapped[str] = mapped_column(String(20))
    cos: Mapped[list["CourseOutcome"]] = relationship(cascade="all, delete-orphan", passive_deletes=True)
    students: Mapped[list["Student"]] = relationship(cascade="all, delete-orphan", passive_deletes=True)

    @property
    def co_count(self) -> int:
        return len(self.cos)

    @property
    def student_count(self) -> int:
        return len(self.students)


class CourseOutcome(Base):
    __tablename__ = "course_outcomes"
    __table_args__ = (UniqueConstraint("course_id", "code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(String(500))


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("course_id", "roll_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    roll_number: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(100))


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (
        UniqueConstraint("student_id", "co_id"),
        CheckConstraint("value >= 0 AND value <= 100", name="valid_score_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    co_id: Mapped[int] = mapped_column(ForeignKey("course_outcomes.id", ondelete="CASCADE"), index=True)
    value: Mapped[float] = mapped_column(Float)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

