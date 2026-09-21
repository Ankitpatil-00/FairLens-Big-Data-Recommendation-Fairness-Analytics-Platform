# Dataset

FairLens uses the real [MovieLens 1M dataset](https://grouplens.org/datasets/movielens/1m/), downloaded by `scripts/download_dataset.py`. It contains `users.dat`, `movies.dat`, and `ratings.dat`, separated by `::`. The loader drops malformed rows and validates that all three tables are non-empty. Do not commit the dataset.
