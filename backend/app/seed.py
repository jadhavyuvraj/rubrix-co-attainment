from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Course, CourseOutcome, Score, Student

COURSES = [
    ("CS301", "Database Management Systems", [
        "Design relational databases using entity–relationship models.",
        "Write SQL queries to retrieve and manipulate data.",
        "Apply normalization to build well-structured database schemas.",
        "Evaluate transaction management and concurrency control.",
    ], [
        [88, 76, 64, 42], [92, 85, 73, 68], [74, 63, 50, 35], [81, 90, 82, 75],
        [65, 48, 38, 50], [78, 72, 69, 44], [50, 55, 47, 62], [45, 82, 76, 58],
    ]),
    ("CS302", "Software Engineering", [
        "Translate user needs into clear software requirements.",
        "Apply software design principles to modular applications.",
        "Develop test strategies for reliable software delivery.",
        "Plan and evaluate an iterative software development project.",
    ], [
        [82, 77, 90, 65], [75, 82, 69, 70], [62, 50, 48, 40], [91, 89, 85, 94],
        [50, 44, 52, 60], [78, 65, 72, 68], [69, 71, 63, 55], [88, 92, 77, 82],
    ]),
    ("CS203", "Data Structures", [
        "Implement linear data structures for practical problems.",
        "Use trees and graphs to represent structured information.",
        "Compare searching and sorting algorithms by complexity.",
        "Select suitable data structures for application requirements.",
    ], [
        [76, 65, 81, 70], [87, 91, 72, 83], [50, 42, 66, 48], [90, 85, 88, 92],
        [48, 37, 45, 51], [69, 71, 76, 64], [55, 50, 62, 43], [82, 78, 91, 75],
    ]),
]
NAMES = ["Aarav Sharma", "Ananya Patel", "Arjun Deshmukh", "Diya Nair",
         "Ishaan Mehta", "Kavya Reddy", "Rohan Kulkarni", "Saanvi Joshi"]


def seed_database(db: Session) -> bool:
    if db.scalar(select(Course.id).limit(1)) is not None:
        return False
    for index, (code, name, descriptions, marks) in enumerate(COURSES):
        course = Course(code=code, name=name, department="Computer Science & Engineering",
                        semester=3 if index == 2 else 5, academic_year="2026–27")
        course.cos = [CourseOutcome(code=f"CO{i + 1}", description=description)
                      for i, description in enumerate(descriptions)]
        course.students = [Student(roll_number=f"CS{23001 + i}", name=student_name)
                           for i, student_name in enumerate(NAMES)]
        db.add(course)
        db.flush()
        for student, row in zip(course.students, marks):
            for co, value in zip(course.cos, row):
                db.add(Score(student_id=student.id, co_id=co.id, value=value))
    db.commit()
    return True


if __name__ == "__main__":
    from .config import settings
    from .database import Base, make_engine

    engine = make_engine(settings.database_url)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        print("Demo courses created." if seed_database(session) else "Courses already exist; seed skipped.")
    engine.dispose()
