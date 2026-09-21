import math
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.sql import DataFrame, functions as F

def rmse(predictions: DataFrame) -> float:
    return RegressionEvaluator(metricName="rmse", labelCol="rating", predictionCol="prediction").evaluate(predictions)

def ranking_metrics(recs: DataFrame, test: DataFrame, k: int, threshold: float) -> dict[str, float]:
    if k <= 0:
        return {"precision_at_k": 0.0, "recall_at_k": 0.0, "ndcg_at_k": 0.0}

    # Precompute discount factors and cumulative ideal DCG values for fast lookup
    discounts = [1.0 / math.log2(i + 2) for i in range(k)]
    ideal_dcg_table = [0.0]
    for d in discounts:
        ideal_dcg_table.append(ideal_dcg_table[-1] + d)

    relevant = test.filter(F.col("rating") >= threshold).groupBy("user_id").agg(F.collect_set("movie_id").alias("relevant"))
    joined = recs.filter(F.col("rank") <= k).groupBy("user_id").agg(
        F.sort_array(F.collect_list(F.struct("rank", "movie_id"))).alias("rows")
    ).join(relevant, "user_id")
    
    rows = joined.select("rows", "relevant").collect()
    if not rows:
        return {"precision_at_k": 0.0, "recall_at_k": 0.0, "ndcg_at_k": 0.0}

    total_precision = 0.0
    total_recall = 0.0
    total_ndcg = 0.0

    for row in rows:
        truth = set(row.relevant)
        num_truth = len(truth)
        if num_truth == 0:
            continue

        hits_count = 0
        dcg = 0.0
        for index, item in enumerate(row.rows[:k]):
            if item.movie_id in truth:
                hits_count += 1
                dcg += discounts[index]

        total_precision += hits_count / k
        total_recall += hits_count / num_truth
        ideal = ideal_dcg_table[min(num_truth, k)]
        if ideal > 0:
            total_ndcg += dcg / ideal

    n = max(len(rows), 1)
    return {
        "precision_at_k": total_precision / n,
        "recall_at_k": total_recall / n,
        "ndcg_at_k": total_ndcg / n
    }

def group_precision(recs: DataFrame, test: DataFrame, users: DataFrame, group: str, k: int, threshold: float) -> dict[str, float]:
    relevant = test.filter(F.col("rating") >= threshold).select("user_id", "movie_id")
    top_k_recs = recs.filter(F.col("rank") <= k)
    
    denominators = top_k_recs.join(users.select("user_id", group), "user_id").groupBy(group).count()
    denom_dict = {str(r[group]): r["count"] for r in denominators.collect()}
    
    hits = top_k_recs.join(relevant, ["user_id", "movie_id"]).join(users.select("user_id", group), "user_id").groupBy(group).count()
    hits_dict = {str(r[group]): r["count"] for r in hits.collect()}
    
    return {
        g: (hits_dict.get(g, 0) / count) if count > 0 else 0.0
        for g, count in denom_dict.items()
    }

