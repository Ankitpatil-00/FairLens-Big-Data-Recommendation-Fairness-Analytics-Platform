"""Small end-to-end test of the non-Spark ranking path; production runs use Spark ALS."""
from src.recommender.reranker import rerank
from src.diversity.diversity_metrics import catalog_coverage

def test_candidate_to_fairlens_pipeline():
    candidates = [
        {"movie_id": 10, "prediction": 4.8, "genres": "Action|Thriller", "popularity_group": "popular"},
        {"movie_id": 11, "prediction": 4.6, "genres": "Drama", "popularity_group": "less_popular"},
        {"movie_id": 12, "prediction": 4.2, "genres": "Comedy", "popularity_group": "medium"},
    ]
    output = rerank(candidates, {"diversity_weight": .12, "fairness_weight": .08, "popularity_weight": .1}, 2)
    assert [x["rank"] for x in output] == [1, 2]
    assert catalog_coverage({x["movie_id"] for x in output}, {10, 11, 12}) > 0
