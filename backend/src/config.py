from pathlib import Path
import os
import sys
import shutil
import yaml
from pyspark.sql import SparkSession

ROOT = Path(__file__).resolve().parents[1]

def ensure_java_home() -> str | None:
    """Ensure JAVA_HOME points to a valid existing Java installation."""
    current = os.environ.get("JAVA_HOME")
    if current and os.path.exists(os.path.join(current, "bin", "java.exe" if sys.platform == "win32" else "java")):
        return current

    candidates = []
    if sys.platform == "win32":
        for base in [r"C:\Program Files\Java", r"C:\Program Files (x86)\Java"]:
            if os.path.exists(base):
                for entry in sorted(os.listdir(base), reverse=True):
                    cand = os.path.join(base, entry)
                    if os.path.exists(os.path.join(cand, "bin", "java.exe")):
                        candidates.append(cand)
        java_exe = shutil.which("java")
        if java_exe:
            parent = os.path.dirname(os.path.dirname(java_exe))
            if os.path.exists(os.path.join(parent, "bin", "java.exe")):
                candidates.append(parent)
    else:
        for cand in ["/usr/lib/jvm/default-java", "/usr/lib/jvm/java-17-openjdk", "/usr/lib/jvm/java-11-openjdk", "/usr/lib/jvm/java-8-openjdk"]:
            if os.path.exists(cand):
                candidates.append(cand)

    for cand in candidates:
        if os.path.exists(cand):
            os.environ["JAVA_HOME"] = cand
            return cand
    return None

# Ensure PySpark workers use current Python interpreter and valid Java
ensure_java_home()
os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)

def load_config(path: str | Path = ROOT / "config" / "config.yaml") -> dict:
    with open(path, encoding="utf-8") as file:
        config = yaml.safe_load(file)
    for key, value in config["paths"].items():
        config["paths"][key] = str((ROOT / value).resolve())
    return config

def get_spark_session(app_name: str | None = None, config: dict | None = None) -> SparkSession:
    ensure_java_home()
    if config is None:
        config = load_config()
    spark_conf = config.get("spark", {})
    name = app_name or spark_conf.get("app_name", "FairLens")
    master = spark_conf.get("master", "local[*]")
    shuffle_parts = str(spark_conf.get("shuffle_partitions", "8"))
    driver_mem = spark_conf.get("driver_memory", "4g")

    builder = (
        SparkSession.builder.appName(name)
        .master(master)
        .config("spark.sql.shuffle.partitions", shuffle_parts)
        .config("spark.driver.memory", driver_mem)
        .config("spark.ui.enabled", "false")
        .config("spark.driver.extraJavaOptions", "-Djava.net.preferIPv4Stack=true")
        .config("spark.executor.extraJavaOptions", "-Djava.net.preferIPv4Stack=true")
    )
    return builder.getOrCreate()

