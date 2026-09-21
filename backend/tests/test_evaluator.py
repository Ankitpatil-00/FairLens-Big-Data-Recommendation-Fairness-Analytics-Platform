import pytest
from src.evaluation.evaluator import rmse, ranking_metrics, group_precision

def test_ranking_metrics_and_rmse(spark):
    # Test rmse with small predictions DataFrame
    preds = spark.createDataFrame([(1, 1, 4.0, 4.0), (1, 2, 3.0, 3.5)], ["user_id", "movie_id", "rating", "prediction"])
    err = rmse(preds)
    assert err >= 0.0

    # Test ranking_metrics with known hits
    recs = spark.createDataFrame([(1, 101, 1, 4.5), (1, 102, 2, 4.0)], ["user_id", "movie_id", "rank", "prediction"])
    test = spark.createDataFrame([(1, 101, 4.5), (1, 103, 5.0)], ["user_id", "movie_id", "rating"])
    metrics = ranking_metrics(recs, test, k=2, threshold=4.0)
    assert metrics["precision_at_k"] == 0.5
    assert metrics["recall_at_k"] == 0.5
    assert metrics["ndcg_at_k"] > 0

def test_group_precision(spark):
    recs = spark.createDataFrame([(1, 101, 1), (2, 201, 1)], ["user_id", "movie_id", "rank"])
    test = spark.createDataFrame([(1, 101, 5.0), (2, 999, 5.0)], ["user_id", "movie_id", "rating"])
    users = spark.createDataFrame([(1, "F"), (2, "M")], ["user_id", "gender"])
    
    gp = group_precision(recs, test, users, "gender", k=1, threshold=4.0)
    assert gp["F"] == 1.0
    assert gp["M"] == 0.0
