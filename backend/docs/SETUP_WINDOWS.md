# Windows setup

1. Install Python 3.11 and a 64-bit Java 17 JDK.
2. In PowerShell: `setx JAVA_HOME "C:\Program Files\Java\jdk-17"`, then open a new terminal.
3. Create and activate `.venv`, then `pip install -r requirements.txt`.
4. Run the commands in the README.

If Spark says Java is missing, check `echo $env:JAVA_HOME` and verify `%JAVA_HOME%\bin\java.exe` exists. `SPARK_HOME` is normally unnecessary because PySpark supplies Spark. On Windows, close dashboard Spark sessions cleanly before retraining.
