"""FairLens source package."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Ensure PySpark workers and driver use the exact same Python interpreter
os.environ["PYSPARK_PYTHON"] = sys.executable
os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable

if os.name == "nt":
    runtime_hadoop = ROOT / ".runtime" / "hadoop"
    if runtime_hadoop.exists() and ("HADOOP_HOME" not in os.environ or not Path(os.environ["HADOOP_HOME"]).exists()):
        os.environ["HADOOP_HOME"] = str(runtime_hadoop.resolve())
        hadoop_bin = str((runtime_hadoop / "bin").resolve())
        if hadoop_bin not in os.environ.get("PATH", ""):
            os.environ["PATH"] = f"{hadoop_bin};{os.environ.get('PATH', '')}"

    runtime_jdk = ROOT / ".runtime" / "jdk17"
    if runtime_jdk.exists() and ("JAVA_HOME" not in os.environ or not Path(os.environ["JAVA_HOME"]).exists()):
        os.environ["JAVA_HOME"] = str(runtime_jdk.resolve())
        jdk_bin = str((runtime_jdk / "bin").resolve())
        if jdk_bin not in os.environ.get("PATH", ""):
            os.environ["PATH"] = f"{jdk_bin};{os.environ.get('PATH', '')}"

    os.environ.setdefault("_JAVA_OPTIONS", "-Djava.net.preferIPv4Stack=true")

