def explain(item: dict, user_genres: set[str]) -> str:
    item_genres = set(g for g in str(item.get("genres") or "").split("|") if g)
    overlap = item_genres & {g for g in user_genres if g}
    prediction = float(item.get("prediction", 0.0))
    reasons = [f"strong ALS predicted rating ({prediction:.2f})"]
    if overlap:
        reasons.append("matches your highly rated genres: " + ", ".join(sorted(overlap)))
    if item.get("popularity_group") == "less_popular":
        reasons.append("the FairLens ranking also gives exposure to less-popular titles")
    return "; ".join(reasons) + "."

