from pathlib import Path
import json
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pyspark.ml.recommendation import ALSModel
from pyspark.sql import functions as F

from src.config import load_config, get_spark_session
from src.data.loader import load_movielens_1m
from src.data.preprocessor import movie_popularity
from src.recommender.recommender import recommend_for_users
from src.recommender.reranker import rerank
from src.explainability.explainer import explain

st.set_page_config(
    page_title="FairLens — Fair Recommendation Analytics",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Premium styling
st.markdown("""
<style>
    .metric-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 18px 22px;
        margin-bottom: 12px;
    }
    .metric-label {
        color: #94A3B8;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-value {
        color: #F8FAFC;
        font-size: 1.75rem;
        font-weight: 700;
        margin-top: 4px;
    }
</style>
""", unsafe_allow_html=True)

config = load_config()
report_path = Path(config["paths"]["results_dir"]) / "baseline_report.json"

@st.cache_resource(show_spinner="Initializing Spark cluster environment...")
def get_spark():
    return get_spark_session("FairLens Dashboard", config)

@st.cache_resource(show_spinner="Loading MovieLens dataset and ALS model...")
def get_model_and_data():
    spark = get_spark()
    users, movies, ratings = load_movielens_1m(spark, config["paths"]["raw_data"])
    movies = movies.cache()
    pop_df = movie_popularity(ratings).select("movie_id", "popularity_group").cache()
    model_path = Path(config["paths"]["model_dir"]) / "als"
    model = ALSModel.load(str(model_path)) if model_path.exists() else None
    return users, movies, ratings, pop_df, model

@st.cache_data
def load_report_data(path_str: str):
    p = Path(path_str)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None

st.sidebar.title("FairLens")
st.sidebar.caption("PySpark Fairness-Aware Recommendation Platform")

page = st.sidebar.radio(
    "Navigation",
    [
        "Overview",
        "Dataset Analytics",
        "User Recommendations",
        "Bias Analysis",
        "Fairness Analysis",
        "Diversity Analysis",
        "Baseline vs FairLens",
        "Recommendation Explanation"
    ]
)

report = load_report_data(str(report_path))

if page == "Overview":
    st.title("FairLens Platform Overview")
    st.markdown("""
    **FairLens** is a high-performance recommendation analytics platform built on **Apache Spark (PySpark)** for the **MovieLens 1M** dataset.
    It evaluates standard collaborative filtering (Spark ALS) against a configurable, transparent **fairness-aware and diversity-promoting re-ranking engine**.
    """)
    
    if report:
        st.subheader("Key Performance & Fairness Summary")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Ratings", f"{report['dataset']['ratings']:,}")
            st.metric("Baseline RMSE", f"{report['baseline']['rmse']:.4f}")
            
        with col2:
            st.metric("Total Users", f"{report['dataset']['users']:,}")
            st.metric("Baseline Precision@K", f"{report['baseline']['precision_at_k']:.4f}")
            
        with col3:
            st.metric("Total Movies", f"{report['dataset']['movies']:,}")
            pfs_base = report['project_fairness_score']['baseline']
            pfs_fair = report['project_fairness_score']['fairlens']
            st.metric("Fairness Score", f"{pfs_fair:.4f}", delta=f"{pfs_fair - pfs_base:+.4f}")
            
        with col4:
            base_disp = report['gender_precision_disparity']['baseline']
            fair_disp = report['gender_precision_disparity']['fairlens']
            st.metric("Gender Disparity", f"{fair_disp:.4f}", delta=f"{fair_disp - base_disp:+.4f}", delta_color="inverse")
            div_base = report['diversity']['baseline_genre_diversity']
            div_fair = report['diversity']['fairlens_genre_diversity']
            st.metric("Genre Diversity", f"{div_fair:.4f}", delta=f"{div_fair - div_base:+.4f}")

        st.markdown("---")
        st.subheader("Complete Pipeline Benchmark Results")
        st.json(report)
    else:
        st.info("Run `python scripts/run_evaluation.py` to generate the evaluation report.")

elif page == "Dataset Analytics":
    st.title("Dataset Analytics")
    if report:
        d = report["dataset"]
        c1, c2, c3 = st.columns(3)
        c1.metric("Users", f"{d['users']:,}")
        c2.metric("Movies", f"{d['movies']:,}")
        c3.metric("Ratings", f"{d['ratings']:,}")
        
    try:
        users, movies, ratings, pop_df, _ = get_model_and_data()
        st.subheader("Movie Genre Distribution")
        movies_pd = movies.select("genres").toPandas()
        all_genres = [g for genres in movies_pd["genres"].dropna() for g in str(genres).split("|") if g]
        genre_df = pd.Series(all_genres).value_counts().reset_index()
        genre_df.columns = ["Genre", "Count"]
        
        fig = px.bar(genre_df, x="Genre", y="Count", color="Count", color_continuous_scale="Viridis", title="Movie Count per Genre")
        fig.update_layout(template="plotly_dark", height=450)
        st.plotly_chart(fig, use_container_width=True)
        
        st.subheader("Ratings Score Distribution")
        ratings_sample = ratings.select("rating").sample(fraction=0.1, seed=42).toPandas()
        fig_r = px.histogram(ratings_sample, x="rating", nbins=5, title="Rating Score Distribution (10% Random Sample)", color_discrete_sequence=["#6366F1"])
        fig_r.update_layout(template="plotly_dark", height=380)
        st.plotly_chart(fig_r, use_container_width=True)
    except Exception as ex:
        st.error(f"Error loading dataset analytics: {ex}")

elif page == "Bias Analysis":
    st.title("Popularity & Exposure Bias Analysis")
    if report and "popularity_exposure" in report:
        pop = report["popularity_exposure"]
        df_pop = pd.DataFrame({
            "Popularity Tier": list(pop["baseline"].keys()) * 2,
            "Exposure Share": list(pop["baseline"].values()) + list(pop["fairlens"].values()),
            "Model": ["Baseline (ALS)"] * len(pop["baseline"]) + ["FairLens Re-ranked"] * len(pop["fairlens"])
        })
        
        fig = px.bar(
            df_pop,
            x="Popularity Tier",
            y="Exposure Share",
            color="Model",
            barmode="group",
            title="Exposure Distribution by Popularity Tier",
            color_discrete_map={"Baseline (ALS)": "#EF4444", "FairLens Re-ranked": "#10B981"}
        )
        fig.update_layout(template="plotly_dark", height=450)
        st.plotly_chart(fig, use_container_width=True)
        
        st.info("Key Finding: Standard ALS heavily over-indexes on popular blockbuster items. FairLens re-ranking boosts exposure for less-popular and long-tail items while mitigating superstar concentration.")
    else:
        st.warning("Evaluation report not found. Please run `python scripts/run_evaluation.py` first.")

elif page == "Fairness Analysis":
    st.title("Demographic Fairness & Disparity Analysis")
    if report:
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Gender Precision Disparity")
            g_base = report["group_precision"]["baseline_gender"]
            g_fair = report["group_precision"]["fairlens_gender"]
            df_gender = pd.DataFrame({
                "Gender": ["Female (F)", "Male (M)", "Female (F)", "Male (M)"],
                "Precision@K": [g_base.get("F", 0), g_base.get("M", 0), g_fair.get("F", 0), g_fair.get("M", 0)],
                "Model": ["Baseline", "Baseline", "FairLens", "FairLens"]
            })
            fig_g = px.bar(df_gender, x="Gender", y="Precision@K", color="Model", barmode="group", title="Precision@K across Gender Groups")
            fig_g.update_layout(template="plotly_dark")
            st.plotly_chart(fig_g, use_container_width=True)
            
        with col2:
            st.subheader("Age Group Precision (Baseline)")
            age_data = report["group_precision"].get("age", {})
            df_age = pd.DataFrame({"Age Group": list(age_data.keys()), "Precision@K": list(age_data.values())})
            fig_a = px.bar(df_age, x="Age Group", y="Precision@K", title="Precision@K by Age Demographic", color_discrete_sequence=["#8B5CF6"])
            fig_a.update_layout(template="plotly_dark")
            st.plotly_chart(fig_a, use_container_width=True)

        st.json({
            "gender_precision_disparity": report.get("gender_precision_disparity"),
            "project_fairness_score": report.get("project_fairness_score")
        })
    else:
        st.warning("Evaluation report not found. Please run `python scripts/run_evaluation.py`.")

elif page == "Diversity Analysis":
    st.title("Diversity & Catalog Coverage")
    if report and "diversity" in report:
        div = report["diversity"]
        c1, c2 = st.columns(2)
        
        with c1:
            st.metric("Baseline Genre Diversity", f"{div['baseline_genre_diversity']:.4f}")
            st.metric("FairLens Genre Diversity", f"{div['fairlens_genre_diversity']:.4f}", delta=f"{div['fairlens_genre_diversity'] - div['baseline_genre_diversity']:+.4f}")
            
        with c2:
            st.metric("Baseline Catalog Coverage", f"{div['baseline_catalog_coverage'] * 100:.2f}%")
            st.metric("FairLens Catalog Coverage", f"{div['fairlens_catalog_coverage'] * 100:.2f}%", delta=f"{(div['fairlens_catalog_coverage'] - div['baseline_catalog_coverage']) * 100:+.2f}%")

        df_div = pd.DataFrame({
            "Metric": ["Intra-List Genre Diversity", "Intra-List Genre Diversity", "Catalog Coverage", "Catalog Coverage"],
            "Value": [div["baseline_genre_diversity"], div["fairlens_genre_diversity"], div["baseline_catalog_coverage"], div["fairlens_catalog_coverage"]],
            "Model": ["Baseline", "FairLens", "Baseline", "FairLens"]
        })
        fig = px.bar(df_div, x="Metric", y="Value", color="Model", barmode="group", title="Diversity & Coverage Comparison")
        fig.update_layout(template="plotly_dark")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("Evaluation report not found. Run `python scripts/run_evaluation.py`.")

else:
    # User Recommendations, Baseline vs FairLens, and Recommendation Explanation
    st.title(page)
    spark = get_spark()
    users, movies, ratings, pop_df, model = get_model_and_data()
    
    if model is None:
        st.error("ALS model not found in `models/als`. Please run `python scripts/train_model.py` first.")
    else:
        st.sidebar.subheader("Re-ranking Parameters")
        user_id = st.sidebar.number_input("User ID", min_value=1, max_value=6040, value=1, step=1)
        top_k = st.sidebar.slider("Top K Recommendations", min_value=5, max_value=25, value=config["evaluation"]["top_k"])
        
        div_w = st.sidebar.slider("Diversity Weight", 0.0, 0.5, float(config["reranking"]["diversity_weight"]), 0.01)
        fair_w = st.sidebar.slider("Fairness Weight (Less-Popular)", 0.0, 0.5, float(config["reranking"]["fairness_weight"]), 0.01)
        pop_w = st.sidebar.slider("Popularity Penalty Weight", 0.0, 0.5, float(config["reranking"]["popularity_weight"]), 0.01)
        
        custom_weights = {
            "diversity_weight": div_w,
            "fairness_weight": fair_w,
            "popularity_weight": pop_w,
            "candidate_multiplier": config["reranking"]["candidate_multiplier"]
        }
        
        candidate_count = top_k * custom_weights["candidate_multiplier"]
        user_df = spark.createDataFrame([(int(user_id),)], ["user_id"])
        candidates = recommend_for_users(model, ratings, user_df, candidate_count)
        
        rows = [
            r.asDict()
            for r in candidates.join(movies, "movie_id").join(pop_df, "movie_id").orderBy("rank").collect()
        ]
        
        user_genres = {
            g for r in ratings.filter((F.col("user_id") == int(user_id)) & (F.col("rating") >= 4))
            .join(movies, "movie_id").select("genres").collect()
            for g in (str(r.genres).split("|") if r.genres else []) if g
        }
        
        fair_recs = rerank(rows, custom_weights, top_k)
        for item in fair_recs:
            item["explanation"] = explain(item, user_genres)
        baseline_recs = rows[:top_k]

        st.caption(f"Showing recommendations for User #{user_id} (Favorite genres: {', '.join(sorted(user_genres)) or 'None recorded'})")

        if page == "User Recommendations":
            df_display = pd.DataFrame(fair_recs)[["rank", "title", "genres", "popularity_group", "prediction", "final_score", "explanation"]]
            st.dataframe(df_display, use_container_width=True, hide_index=True)

        elif page == "Baseline vs FairLens":
            c1, c2 = st.columns(2)
            with c1:
                st.subheader("Baseline (Spark ALS)")
                df_b = pd.DataFrame(baseline_recs)[["rank", "title", "genres", "popularity_group", "prediction"]]
                st.dataframe(df_b, use_container_width=True, hide_index=True)
            with c2:
                st.subheader("FairLens (Re-ranked)")
                df_f = pd.DataFrame(fair_recs)[["rank", "title", "genres", "popularity_group", "prediction", "final_score"]]
                st.dataframe(df_f, use_container_width=True, hide_index=True)
                
        elif page == "Recommendation Explanation":
            st.subheader("Decision Explanations")
            df_exp = pd.DataFrame(fair_recs)[["rank", "title", "popularity_group", "prediction", "final_score", "explanation", "rerank_reason"]]
            st.dataframe(df_exp, use_container_width=True, hide_index=True)
