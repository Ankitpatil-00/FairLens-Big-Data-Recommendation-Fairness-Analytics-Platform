"""Download the official MovieLens 1M archive from GroupLens."""
from pathlib import Path
from urllib.request import urlretrieve
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "data"
archive = target / "ml-1m.zip"
target.mkdir(parents=True, exist_ok=True)
if not (target / "ml-1m" / "ratings.dat").exists():
    print("Downloading MovieLens 1M from GroupLens (terms: https://grouplens.org/datasets/movielens/1m/)")
    urlretrieve("https://files.grouplens.org/datasets/movielens/ml-1m.zip", archive)
    with ZipFile(archive) as file: file.extractall(target)
    archive.unlink()
print(f"Dataset ready: {target / 'ml-1m'}")
