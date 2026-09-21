import pytest
import numpy as np
from src.data.multi_dataset import UnifiedDataset
from server import ENGINE

def test_unified_dataset_initialization():
    ds = ENGINE.ds
    assert ds.total_ratings_count == 5800000
    assert len(ds.users) == 30000
    assert len(ds.movies) == 7500
    assert ds.item_matrix.shape[0] == 7500
    assert ds.item_matrix.shape[1] == 20

def test_unified_recommendation():
    recs = ENGINE.recommend(user_id=1, top_k=10, fair_w=0.25, div_w=0.15, pop_w=0.15)
    assert len(recs["fairlens"]) == 10
    assert len(recs["baseline"]) == 10
    assert "stats" in recs
    # Verify FairLens successfully reduces popular blockbuster domination
    assert recs["stats"]["fairlens_exposure"]["popular"] <= recs["stats"]["baseline_exposure"]["popular"]
    # Verify FairLens increases intra-list diversity
    assert recs["stats"]["fairlens_diversity"] >= recs["stats"]["baseline_diversity"]

def test_unified_personas():
    personas = ENGINE.get_personas()
    assert len(personas) == 5
    assert personas[0]["user_id"] == 1

def test_unified_movie_search():
    search_res = ENGINE.search_movies(query="Star", page=1, page_size=10)
    assert "movies" in search_res
    assert search_res["total"] > 0

def test_unified_custom_genre_filtering():
    # Test strict genre filtering
    recs = ENGINE.recommend(user_id=1, top_k=10, selected_genres=["Sci-Fi", "Action"], genre_mode="filter")
    assert len(recs["fairlens"]) == 10
    for movie in recs["fairlens"]:
        genre_set = set(movie["genre_list"])
        assert bool(genre_set & {"Sci-Fi", "Action"})

def test_unified_custom_genre_boosting():
    # Test soft genre boosting
    recs = ENGINE.recommend(user_id=1, top_k=10, selected_genres=["Animation"], genre_mode="boost")
    assert len(recs["fairlens"]) == 10
    assert "selected_genres" in recs
    assert "Animation" in recs["selected_genres"]
