from pyspark.ml.recommendation import ALSModel
from pyspark.sql import DataFrame, Window, functions as F

def recommend_for_users(model: ALSModel, train: DataFrame, users: DataFrame, k: int) -> DataFrame:
    raw = model.recommendForUserSubset(users.select("user_id"), k)
    recs = raw.select(
        "user_id",
        F.posexplode("recommendations").alias("rank0", "rec")
    ).select(
        "user_id",
        F.col("rec.movie_id").alias("movie_id"),
        F.col("rec.rating").alias("prediction")
    )
    unseen = recs.join(
        train.select("user_id", "movie_id").withColumn("seen", F.lit(1)),
        ["user_id", "movie_id"],
        "left_anti"
    )
    window = Window.partitionBy("user_id").orderBy(F.col("prediction").desc())
    return unseen.withColumn("rank", F.row_number().over(window))
