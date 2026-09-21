from collections import Counter

def exposure_distribution(recommendations: list[dict], popularity: dict[int, str]) -> dict[str, float]:
    labels = [popularity.get(int(r["movie_id"]), "unknown") for r in recommendations]
    total = len(labels) or 1
    return {group: count / total for group, count in Counter(labels).items()}

def group_disparity(group_scores: dict[str, float]) -> float | None:
    values = list(group_scores.values())
    return max(values) - min(values) if len(values) >= 2 else None

def project_fairness_score(disparity: float | None) -> float | None:
    """Project-defined score: 1 - absolute quality disparity, clipped to [0,1]."""
    return None if disparity is None else max(0.0, min(1.0, 1.0 - disparity))
