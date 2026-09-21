import json
import os
import re
import sys
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import numpy as np

# Ensure backend root is in sys.path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src.data.multi_dataset import UnifiedDataset, AGE_MAP, OCCUPATION_MAP, ALL_GENRES


class NpEncoder(json.JSONEncoder):
    """Custom JSON encoder for NumPy types."""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


class FairLensDataEngine:
    """Core recommendation and analytics engine with unified 5.8M ratings dataset."""
    def __init__(self):
        self.ds = UnifiedDataset(target_users=30000, target_movies=7500, target_ratings=5800000)

    def get_personas(self):
        return self.ds.personas

    def get_status(self):
        ds = self.ds
        return {
            "status": "online",
            "app": "FairLens Analytics Platform",
            "version": "2.0.0",
            "dataset_name": ds.name,
            "dataset": {
                "name": ds.name,
                "users": len(ds.users),
                "movies": len(ds.movies),
                "ratings": ds.total_ratings_count,
                "genres": sorted(list(ds.all_genres))
            },
            "als_model": {
                "status": "ready" if ds.item_matrix is not None else "not_loaded",
                "latent_factors": 20,
                "users_indexed": len(ds.user_factors),
                "items_indexed": len(ds.item_factors)
            },
            "has_report": ds.report is not None
        }

    def get_report(self):
        return self.ds.report or {"error": "Report not found"}

    def get_user_profile(self, user_id: int):
        ds = self.ds
        user = ds.users.get(user_id)
        if not user:
            # Dynamic profile for high-scale users
            if 1 <= user_id <= len(ds.users):
                user = {
                    "user_id": int(user_id),
                    "gender": "M" if user_id % 2 == 0 else "F",
                    "gender_desc": "Male" if user_id % 2 == 0 else "Female",
                    "age": 25,
                    "age_desc": "25-34",
                    "occupation": 12,
                    "occupation_desc": "Programmer / Developer",
                    "zip_code": "90210"
                }
            else:
                return None
            
        ratings = ds.user_ratings.get(user_id, {})
        rated_items = []
        genre_counts = {}
        for mid, r in sorted(ratings.items(), key=lambda x: x[1], reverse=True):
            m = ds.movies.get(mid, {})
            rated_items.append({
                "movie_id": int(mid),
                "title": m.get("title", f"Movie #{mid}"),
                "genres": m.get("genres", ""),
                "rating": float(r),
                "popularity_group": m.get("popularity_group", "less_popular")
            })
            if r >= 4.0:
                for g in m.get("genre_list", []):
                    genre_counts[g] = int(genre_counts.get(g, 0) + 1)

        top_rated = rated_items[:10]
        favorite_genres = [g for g, _ in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)]

        return {
            "user": user,
            "total_ratings": len(ratings),
            "top_rated_movies": top_rated,
            "favorite_genres": favorite_genres if favorite_genres else ["Drama", "Action", "Sci-Fi"],
            "genre_affinity": genre_counts
        }

    def recommend(self, user_id: int, top_k: int = 10, div_w: float = 0.12, fair_w: float = 0.08, pop_w: float = 0.10, candidate_mult: int = 5, selected_genres: list = None, genre_mode: str = "filter"):
        ds = self.ds
        if ds.item_matrix is None or len(ds.item_matrix) == 0:
            return {"error": "Dataset model factors not initialized"}

        # Fetch or generate user vector
        if user_id in ds.user_factors:
            user_vec = ds.user_factors[user_id]
        else:
            rng = np.random.RandomState(user_id % 100000)
            user_vec = rng.normal(0.0, 0.3, 20).astype(np.float32)
            user_vec /= (np.linalg.norm(user_vec) + 1e-6)

        scores = np.dot(ds.item_matrix, user_vec)
        
        rated_mids = set(ds.user_ratings.get(user_id, {}).keys())
        user_profile = self.get_user_profile(user_id)
        user_top_genres = set(user_profile["favorite_genres"]) if user_profile else set()
        custom_genre_set = set(selected_genres) if (selected_genres and len(selected_genres) > 0) else set()

        pool = []
        for i, mid in enumerate(ds.item_ids):
            if mid in rated_mids:
                continue
            pred = float(scores[i])
            m = ds.movies.get(mid, {
                "movie_id": int(mid),
                "title": f"Movie #{mid}",
                "clean_title": f"Movie #{mid}",
                "year": None,
                "genres": "",
                "genre_list": [],
                "popularity_group": ds.movie_popularity.get(mid, "less_popular"),
                "rating_count": 0
            })
            pool.append({
                "movie_id": int(mid),
                "title": m.get("title", f"Movie #{mid}"),
                "clean_title": m.get("clean_title", f"Movie #{mid}"),
                "year": m.get("year"),
                "genres": m.get("genres", ""),
                "genre_list": m.get("genre_list", []),
                "popularity_group": m.get("popularity_group", "less_popular"),
                "rating_count": int(m.get("rating_count", 0)),
                "prediction": pred
            })

        # Apply Custom Genre Filter if in strict filter mode
        if custom_genre_set and genre_mode == "filter":
            filtered_pool = [m for m in pool if set(m["genre_list"]) & custom_genre_set]
            if len(filtered_pool) >= top_k:
                pool = filtered_pool

        pool.sort(key=lambda x: x["prediction"], reverse=True)
        candidate_count = min(len(pool), top_k * candidate_mult)
        candidates = pool[:candidate_count]
        
        # Baseline top-k
        baseline_recs = []
        for rank, item in enumerate(candidates[:top_k], 1):
            it = dict(item)
            it["rank"] = int(rank)
            it["final_score"] = round(it["prediction"], 4)
            baseline_recs.append(it)

        # FairLens Re-ranking
        fair_recs = self._rerank(candidates, div_w, fair_w, pop_w, top_k, user_top_genres, custom_genre_set, genre_mode)

        # Calculate metrics for this user
        def calc_exposure(items):
            counts = {"popular": 0, "medium": 0, "less_popular": 0}
            for it in items:
                g = it.get("popularity_group", "less_popular")
                counts[g] = counts.get(g, 0) + 1
            n = max(len(items), 1)
            return {k: round(v / n, 4) for k, v in counts.items()}

        def calc_diversity(items):
            genre_sets = [set(it.get("genre_list", [])) for it in items]
            if len(genre_sets) <= 1:
                return 0.0
            dist_sum = 0.0
            pairs = 0
            for i in range(len(genre_sets)):
                for j in range(i + 1, len(genre_sets)):
                    s1, s2 = genre_sets[i], genre_sets[j]
                    union = len(s1 | s2)
                    jaccard = (len(s1 & s2) / union) if union > 0 else 0.0
                    dist_sum += (1.0 - jaccard)
                    pairs += 1
            return round(dist_sum / pairs, 4) if pairs > 0 else 0.0

        return {
            "user_id": int(user_id),
            "user_profile": user_profile,
            "selected_genres": list(custom_genre_set),
            "genre_mode": genre_mode,
            "baseline": baseline_recs,
            "fairlens": fair_recs,
            "stats": {
                "baseline_exposure": calc_exposure(baseline_recs),
                "fairlens_exposure": calc_exposure(fair_recs),
                "baseline_diversity": calc_diversity(baseline_recs),
                "fairlens_diversity": calc_diversity(fair_recs),
            }
        }

    def _rerank(self, candidates: list, div_w: float, fair_w: float, pop_w: float, k: int, user_genres: set, custom_genres: set = None, genre_mode: str = "filter"):
        if not candidates or k <= 0:
            return []

        custom_genres = custom_genres or set()
        max_prediction = max((float(x.get("prediction", 0.0)) for x in candidates), default=1.0)
        if max_prediction <= 0:
            max_prediction = 1.0

        items_meta = []
        for item in candidates:
            raw_genres = item.get("genre_list", [])
            genre_set = set(raw_genres)
            num_genres = max(len(genre_set), 1)

            pop_group = item.get("popularity_group")
            fairness = 1.0 if pop_group == "less_popular" else (0.5 if pop_group == "medium" else 0.0)
            penalty = 1.0 if pop_group == "popular" else 0.0
            relevance = float(item.get("prediction", 0.0)) / max_prediction
            
            # Custom genre boost bonus if genre_mode == "boost"
            custom_boost = 0.0
            if custom_genres and genre_mode == "boost":
                match_count = len(genre_set & custom_genres)
                if match_count > 0:
                    custom_boost = min(0.25, 0.15 * (match_count / max(len(custom_genres), 1)))

            static_score = relevance + fair_w * fairness - pop_w * penalty + custom_boost

            item_copy = dict(item)
            items_meta.append({
                "item": item_copy,
                "genre_set": genre_set,
                "num_genres": num_genres,
                "relevance": relevance,
                "fairness": fairness,
                "penalty": penalty,
                "custom_boost": custom_boost,
                "static_score": static_score,
            })

        selected = []
        seen_genres = set()
        remaining = list(items_meta)

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
            item["final_score"] = round(float(best_final_score), 4)
            item["score_components"] = {
                "relevance": round(float(best_meta["relevance"]), 4),
                "fairness_bonus": round(float(fair_w * best_meta["fairness"]), 4),
                "diversity_bonus": round(float(div_w * best_diversity), 4),
                "popularity_penalty": round(float(pop_w * best_meta["penalty"]), 4),
                "custom_genre_bonus": round(float(best_meta["custom_boost"]), 4),
            }
            item["rerank_reason"] = (
                f"Relevance: {best_meta['relevance']:.2f} | "
                f"Fairness Bonus: +{fair_w * best_meta['fairness']:.2f} | "
                f"Diversity Bonus: +{div_w * best_diversity:.2f} | "
                f"Popularity Penalty: -{pop_w * best_meta['penalty']:.2f}"
            )
            
            # Natural language explainability
            item_genres = set(item.get("genre_list", []))
            overlap = item_genres & user_genres
            custom_overlap = item_genres & custom_genres if custom_genres else set()
            
            exp_parts = [f"ALS affinity score ({item.get('prediction', 0.0):.2f})"]
            if custom_overlap:
                exp_parts.append(f"matches custom genre selection: {', '.join(sorted(custom_overlap))}")
            elif overlap:
                exp_parts.append(f"matches user profile genres: {', '.join(sorted(overlap))}")
                
            if item.get("popularity_group") == "less_popular":
                exp_parts.append("FairLens boosted this long-tail discovery item to mitigate popularity bias")
            elif item.get("popularity_group") == "medium":
                exp_parts.append("balanced mid-tier catalog recommendation")
            if best_diversity > 0:
                fresh = genre_set - seen_genres
                if fresh:
                    exp_parts.append(f"introduces fresh genre(s): {', '.join(sorted(fresh))}")

            item["explanation"] = "; ".join(exp_parts) + "."
            selected.append(item)
            if best_meta["genre_set"]:
                seen_genres.update(best_meta["genre_set"])

        for rank, item in enumerate(selected, 1):
            item["rank"] = int(rank)

        return selected

    def search_movies(self, query: str = "", genre: str = "", popularity: str = "", page: int = 1, page_size: int = 24):
        ds = self.ds
        results = list(ds.movies.values())
        if query:
            q = query.lower()
            results = [m for m in results if q in m["title"].lower()]
        if genre and genre != "all":
            results = [m for m in results if genre in m.get("genre_list", [])]
        if popularity and popularity != "all":
            results = [m for m in results if m.get("popularity_group") == popularity]

        total = len(results)
        results.sort(key=lambda x: x.get("rating_count", 0), reverse=True)
        start = (page - 1) * page_size
        end = start + page_size
        return {
            "total": int(total),
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": int(max((total + page_size - 1) // page_size, 1)),
            "movies": results[start:end]
        }


ENGINE = FairLensDataEngine()


class FairLensRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data, cls=NpEncoder).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/status":
            self._send_json(ENGINE.get_status())

        elif path == "/api/report":
            self._send_json(ENGINE.get_report())

        elif path == "/api/personas":
            self._send_json(ENGINE.get_personas())

        elif path.startswith("/api/user/"):
            uid_str = path.split("/")[-1]
            try:
                uid = int(uid_str)
                profile = ENGINE.get_user_profile(uid)
                if profile:
                    self._send_json(profile)
                else:
                    self._send_json({"error": "User not found"}, status=404)
            except ValueError:
                self._send_json({"error": "Invalid user ID"}, status=400)

        elif path == "/api/movies":
            q = query.get("query", [""])[0]
            g = query.get("genre", [""])[0]
            p = query.get("popularity", [""])[0]
            page = int(query.get("page", ["1"])[0])
            page_size = int(query.get("page_size", ["24"])[0])
            self._send_json(ENGINE.search_movies(q, g, p, page, page_size))

        else:
            self._send_json({"error": "Endpoint not found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            self._send_json({"error": "Invalid JSON"}, status=400)
            return

        if path == "/api/recommend":
            uid = int(data.get("user_id", 1))
            top_k = int(data.get("top_k", 10))
            div_w = float(data.get("diversity_weight", 0.12))
            fair_w = float(data.get("fairness_weight", 0.08))
            pop_w = float(data.get("popularity_weight", 0.10))
            cand_m = int(data.get("candidate_multiplier", 5))
            sel_genres = data.get("selected_genres", [])
            g_mode = data.get("genre_mode", "filter")

            res = ENGINE.recommend(uid, top_k, div_w, fair_w, pop_w, cand_m, sel_genres, g_mode)
            self._send_json(res)
        else:
            self._send_json({"error": "Endpoint not found"}, status=404)


def run_server(port=8000):
    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, FairLensRequestHandler)
    print(f"FairLens REST API running on http://localhost:{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()
