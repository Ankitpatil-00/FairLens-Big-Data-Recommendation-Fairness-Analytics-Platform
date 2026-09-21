from pyspark.sql import DataFrame, functions as F

def age_group(column="age"):
    return (
        F.when(F.col(column) < 18, "Under 18")
        .when(F.col(column) < 25, "18-24")
        .when(F.col(column) < 35, "25-34")
        .when(F.col(column) < 45, "35-44")
        .when(F.col(column) < 50, "45-49")
        .when(F.col(column) < 56, "50-55")
        .otherwise("56+")
    )

def enrich_ratings(users: DataFrame, movies: DataFrame, ratings: DataFrame) -> DataFrame:
    return ratings.join(users, "user_id").join(movies, "movie_id").withColumn("age_group", age_group())

def movie_popularity(ratings: DataFrame) -> DataFrame:
    counts = ratings.groupBy("movie_id").agg(
        F.count("*").alias("rating_count"),
        F.avg("rating").alias("mean_rating")
    )
    quantiles = counts.stat.approxQuantile("rating_count", [0.2, 0.8], 0.01)
    q20, q80 = (quantiles[0], quantiles[1]) if len(quantiles) == 2 else (0.0, 0.0)
    return counts.withColumn(
        "popularity_group",
        F.when(F.col("rating_count") >= q80, "popular")
        .when(F.col("rating_count") <= q20, "less_popular")
        .otherwise("medium")
    )
