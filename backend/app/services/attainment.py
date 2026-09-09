from collections.abc import Iterable
from dataclasses import dataclass
from math import isfinite


@dataclass(frozen=True)
class Attainment:
    total_students: int
    students_attained: int
    attainment_percentage: float


def calculate_co_attainment(scores: Iterable[float], threshold: float) -> Attainment:
    if not isfinite(threshold) or not 0 <= threshold <= 100:
        raise ValueError("Threshold must be between 0 and 100.")
    values = list(scores)
    if any(not isfinite(score) or not 0 <= score <= 100 for score in values):
        raise ValueError("Scores must be between 0 and 100.")
    total = len(values)
    attained = sum(score >= threshold for score in values)
    percentage = round(attained / total * 100, 2) if total else 0.0
    return Attainment(total, attained, percentage)

