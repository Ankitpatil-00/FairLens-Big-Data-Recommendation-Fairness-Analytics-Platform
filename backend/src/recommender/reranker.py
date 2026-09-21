"""Transparent greedy re-ranker. Relevance remains the primary score."""
from collections import Counter

def rerank(candidates: list[dict], weights: dict, k: int) -> list[dict]:
    if not candidates or k <= 0:
        return []

    max_prediction = max((float(x.get("prediction", 0.0)) for x in candidates), default=1.0)
    if max_prediction <= 0:
        max_prediction = 1.0

    div_w = float(weights.get("diversity_weight", 0.0))
    fair_w = float(weights.get("fairness_weight", 0.0))
    pop_w = float(weights.get("popularity_weight", 0.0))

    # Precompute static scores and genre sets for maximum performance
    items_meta = []
    for item in candidates:
        raw_genres = [g for g in str(item.get("genres") or "").split("|") if g]
        genre_set = set(raw_genres)
        num_genres = max(len(genre_set), 1)

        pop_group = item.get("popularity_group")
        fairness = 1.0 if pop_group == "less_popular" else (0.5 if pop_group == "medium" else 0.0)
        penalty = 1.0 if pop_group == "popular" else 0.0
        relevance = float(item.get("prediction", 0.0)) / max_prediction
        static_score = relevance + fair_w * fairness - pop_w * penalty

        item_copy = dict(item)
        items_meta.append({
            "item": item_copy,
            "genre_set": genre_set,
            "num_genres": num_genres,
            "relevance": relevance,
            "fairness": fairness,
            "penalty": penalty,
            "static_score": static_score,
        })

    selected = []
    seen_genres = set()
    remaining = items_meta

    while remaining and len(selected) < k:
        best_meta = None
        best_final_score = -float("inf")
        best_diversity = 0.0

        for meta in remaining:
            genre_set = meta["genre_set"]
            if genre_set and div_w > 0:
                unseen_count = len(genre_set - seen_genres)
                diversity = unseen_count / meta["num_genres"]
            else:
                diversity = 0.0

            final_score = meta["static_score"] + div_w * diversity
            if final_score > best_final_score:
                best_final_score = final_score
                best_meta = meta
                best_diversity = diversity

        if best_meta is None:
            break

        remaining.remove(best_meta)
        item = best_meta["item"]
        item["final_score"] = best_final_score
        item["rerank_reason"] = (
            f"relevance={best_meta['relevance']:.2f}; "
            f"diversity_bonus={best_diversity:.2f}; "
            f"fairness_bonus={best_meta['fairness']:.2f}; "
            f"popularity_penalty={best_meta['penalty']:.2f}"
        )
        selected.append(item)
        if best_meta["genre_set"]:
            seen_genres.update(best_meta["genre_set"])

    for rank, item in enumerate(selected, 1):
        item["rank"] = rank

    return selected


