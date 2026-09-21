import pytest
from src.diversity.diversity_metrics import catalog_coverage, intra_list_genre_diversity
from src.fairness.metrics import group_disparity, project_fairness_score, exposure_distribution
from src.recommender.reranker import rerank
from src.explainability.explainer import explain

def test_coverage_and_diversity():
    assert catalog_coverage({1, 2}, {1, 2, 3, 4}) == 0.5
    assert catalog_coverage(set(), set()) == 0.0
    assert catalog_coverage({1, 2}, set()) == 0.0
    assert intra_list_genre_diversity(["Action", "Drama"]) > 0
    assert intra_list_genre_diversity([]) == 0.0
    assert intra_list_genre_diversity([None, ""]) == 0.0
    assert intra_list_genre_diversity(["Action|Thriller", "Drama"]) > 0

def test_fairness_calculations():
    assert group_disparity({"F": .6, "M": .4}) == pytest.approx(.2)
    assert group_disparity({"F": .5}) is None
    assert group_disparity({}) is None
    assert project_fairness_score(.2) == pytest.approx(.8)
    assert project_fairness_score(None) is None
    assert project_fairness_score(1.5) == 0.0
    assert project_fairness_score(-0.2) == 1.0

def test_exposure_distribution():
    recs = [{"movie_id": 1}, {"movie_id": 2}, {"movie_id": 3}]
    pop = {1: "popular", 2: "less_popular", 3: "popular"}
    dist = exposure_distribution(recs, pop)
    assert dist["popular"] == pytest.approx(2 / 3)
    assert dist["less_popular"] == pytest.approx(1 / 3)

def test_reranker_and_explanation():
    items = [
        {"movie_id": 1, "prediction": 4.0, "genres": "Action", "popularity_group": "popular"},
        {"movie_id": 2, "prediction": 3.9, "genres": "Drama", "popularity_group": "less_popular"}
    ]
    result = rerank(items, {"diversity_weight": .1, "fairness_weight": .1, "popularity_weight": .1}, 2)
    assert len(result) == 2 and "rerank_reason" in result[0]
    assert "ALS" in explain(result[0], {"Action"})

def test_reranker_edge_cases():
    # Empty candidates
    assert rerank([], {}, 5) == []
    # Candidates with missing/empty genres and missing keys
    candidates = [
        {"movie_id": 1, "prediction": 0.0, "genres": None, "popularity_group": None},
        {"movie_id": 2, "prediction": -1.0, "genres": "", "popularity_group": "popular"}
    ]
    res = rerank(candidates, {}, 2)
    assert len(res) == 2
    assert res[0]["rank"] == 1
    assert res[1]["rank"] == 2

def test_explainer_edge_cases():
    # Item with None genres
    item = {"prediction": 3.5, "genres": None, "popularity_group": "less_popular"}
    exp = explain(item, set())
    assert "strong ALS" in exp
    assert "less-popular" in exp
    
    # Item with matching genres
    item_with_genre = {"prediction": 4.5, "genres": "Sci-Fi|Action", "popularity_group": "popular"}
    exp2 = explain(item_with_genre, {"Action", "Comedy"})
    assert "Action" in exp2

