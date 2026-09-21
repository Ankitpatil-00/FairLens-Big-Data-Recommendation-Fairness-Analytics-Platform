# Architecture

`MovieLens files → Spark ingestion → cleaning/Parquet-ready tables → ALS → Top-K candidates → FairLens re-ranker → evaluation and Streamlit dashboard`.

Spark handles ingestion, joins, ALS training and evaluation data. The final re-ranker is deliberately local and greedy because it operates on a small per-user candidate set and needs inspectable item-level reasons.
