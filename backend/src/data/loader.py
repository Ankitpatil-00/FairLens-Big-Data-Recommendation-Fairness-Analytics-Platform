"""Safe MovieLens 1M ingestion using Spark schemas."""
from pathlib import Path
from pyspark.sql import DataFrame, SparkSession, types as T

USERS = T.StructType([
    T.StructField("user_id", T.IntegerType()),
    T.StructField("gender", T.StringType()),
    T.StructField("age", T.IntegerType()),
    T.StructField("occupation", T.IntegerType()),
    T.StructField("zip_code", T.StringType())
])

MOVIES = T.StructType([
    T.StructField("movie_id", T.IntegerType()),
    T.StructField("title", T.StringType()),
    T.StructField("genres", T.StringType())
])

RATINGS = T.StructType([
    T.StructField("user_id", T.IntegerType()),
    T.StructField("movie_id", T.IntegerType()),
    T.StructField("rating", T.FloatType()),
    T.StructField("timestamp", T.LongType())
])

def _read(spark: SparkSession, filename: Path, schema: T.StructType) -> DataFrame:
    if not filename.exists():
        raise FileNotFoundError(f"Required MovieLens file not found: {filename}")
    return (
        spark.read.option("sep", "::")
        .option("encoding", "ISO-8859-1")
        .option("mode", "DROPMALFORMED")
        .schema(schema)
        .csv(str(filename))
        .dropna()
    )

def load_movielens_1m(spark: SparkSession, raw_dir: str | Path) -> tuple[DataFrame, DataFrame, DataFrame]:
    root = Path(raw_dir)
    users = _read(spark, root / "users.dat", USERS)
    movies = _read(spark, root / "movies.dat", MOVIES)
    ratings = _read(spark, root / "ratings.dat", RATINGS).filter("rating >= 1.0 and rating <= 5.0")
    
    # Fast O(1) non-empty validation without scanning entire dataset
    if len(users.head(1)) == 0 or len(movies.head(1)) == 0 or len(ratings.head(1)) == 0:
        raise ValueError("MovieLens load produced an empty table; check delimiter and source files.")
        
    return users, movies, ratings

