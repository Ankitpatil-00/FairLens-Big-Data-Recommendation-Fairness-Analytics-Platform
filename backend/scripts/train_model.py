from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import load_config, get_spark_session
from src.data.loader import load_movielens_1m
from src.data.preprocessor import enrich_ratings
from src.recommender.als_model import split_ratings, train_als

config = load_config()
spark = get_spark_session(config["spark"]["app_name"], config)
try:
    print("Loading MovieLens 1M dataset...")
    users, movies, ratings = load_movielens_1m(spark, config["paths"]["raw_data"])
    processed = Path(config["paths"]["processed_data"])
    
    print("Writing enriched ratings parquet...")
    enrich_ratings(users, movies, ratings).write.mode("overwrite").parquet(str(processed / "ratings_enriched"))
    
    print("Training Spark ALS collaborative filtering model...")
    train, _ = split_ratings(ratings, config["als"]["seed"])
    model = train_als(train, config["als"])
    
    model_dir = Path(config["paths"]["model_dir"])
    model_dir.mkdir(parents=True, exist_ok=True)
    model.write().overwrite().save(str(model_dir / "als"))
    print("Successfully saved ALS model to models/als and enriched Parquet to data/processed/ratings_enriched")
finally:
    spark.stop()

