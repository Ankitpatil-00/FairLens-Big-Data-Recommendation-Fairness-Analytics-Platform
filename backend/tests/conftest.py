import pytest
from pyspark.sql import SparkSession
from src.config import ensure_java_home

@pytest.fixture(scope="session")
def spark():
    ensure_java_home()
    session = SparkSession.builder \
        .appName("FairLensTests") \
        .master("local[1]") \
        .config("spark.driver.host", "127.0.0.1") \
        .config("spark.driver.bindAddress", "127.0.0.1") \
        .config("spark.driver.memory", "1g") \
        .config("spark.sql.shuffle.partitions", "1") \
        .config("spark.ui.enabled", "false") \
        .config("spark.driver.extraJavaOptions", "-Djava.net.preferIPv4Stack=true") \
        .config("spark.executor.extraJavaOptions", "-Djava.net.preferIPv4Stack=true") \
        .getOrCreate()
    yield session
    try:
        session.stop()
    except Exception:
        pass
