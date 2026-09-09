import pytest

from app.services.attainment import Attainment, calculate_co_attainment


def test_exact_threshold_is_attained():
    result = calculate_co_attainment([49.99, 50, 100], 50)
    assert result == Attainment(total_students=3, students_attained=2, attainment_percentage=66.67)


@pytest.mark.parametrize("scores,threshold,attained,percentage", [
    ([50, 70, 100], 50, 3, 100),
    ([0, 20, 49], 50, 0, 0),
    ([], 50, 0, 0),
    ([0, 100], 0, 2, 100),
    ([99.99, 100], 100, 1, 50),
    ([49.5, 50.5], 50.5, 1, 50),
])
def test_attainment_cases(scores, threshold, attained, percentage):
    result = calculate_co_attainment(scores, threshold)
    assert result.total_students == len(scores)
    assert result.students_attained == attained
    assert result.attainment_percentage == percentage


@pytest.mark.parametrize("threshold", [-1, 101, float("nan"), float("inf")])
def test_invalid_threshold(threshold):
    with pytest.raises(ValueError):
        calculate_co_attainment([50], threshold)


@pytest.mark.parametrize("score", [-1, 101, float("nan"), float("inf")])
def test_invalid_score(score):
    with pytest.raises(ValueError):
        calculate_co_attainment([score], 50)

