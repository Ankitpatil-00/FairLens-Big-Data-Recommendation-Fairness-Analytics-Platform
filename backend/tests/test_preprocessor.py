from src.data.preprocessor import age_group

def test_age_group_expression(spark):
    df = spark.createDataFrame([(15,), (20,), (30,), (40,), (48,), (52,), (60,)], ["age"])
    result = df.withColumn("group", age_group("age")).collect()
    groups = [r["group"] for r in result]
    assert groups == ["Under 18", "18-24", "25-34", "35-44", "45-49", "50-55", "56+"]

