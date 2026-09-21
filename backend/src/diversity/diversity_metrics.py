from collections import Counter

def intra_list_genre_diversity(genres: list[str]) -> float:
    """1 - Simpson concentration over genres; 0 means one genre, near 1 varied."""
    tokens = [genre for value in genres if value for genre in str(value).split("|") if genre]
    if not tokens:
        return 0.0
    total = len(tokens)
    return 1 - sum((n / total) ** 2 for n in Counter(tokens).values())

def catalog_coverage(recommended_ids: set[int], catalog_ids: set[int]) -> float:
    return len(recommended_ids & catalog_ids) / len(catalog_ids) if catalog_ids else 0.0
