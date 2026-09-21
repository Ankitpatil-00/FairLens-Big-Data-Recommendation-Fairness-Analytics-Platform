from pyspark.ml.recommendation import ALS, ALSModel
from pyspark.sql import DataFrame

def train_als(train: DataFrame, settings: dict) -> ALSModel:
    return ALS(userCol="user_id", itemCol="movie_id", ratingCol="rating", coldStartStrategy="drop", nonnegative=True, rank=settings["rank"], maxIter=settings["max_iter"], regParam=settings["reg_param"], seed=settings["seed"]).fit(train)

def split_ratings(ratings: DataFrame, seed: int = 42) -> tuple[DataFrame, DataFrame]:
    return ratings.randomSplit([0.8, 0.2], seed=seed)
