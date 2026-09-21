# Fairness metrics

`Precision@K(group)` is calculated separately by gender and age value. **Quality disparity** is `max group precision − min group precision`; lower is better. **Popularity exposure** is the share of recommended items in popular, medium, or less-popular groups, where thresholds are the 80th and 20th percentiles of training rating counts. **Project Fairness Score** is explicitly project-defined as `clip(1 − quality disparity, 0, 1)` and is not an academic fairness metric.

For broader background, see the 2023 ACM Computing Surveys article *Fairness in Recommender Systems: Research Landscape and Future Directions* and [Ekstrand et al., 2022](https://dl.acm.org/doi/10.1145/3546918) on fairness evaluation. Metrics here are descriptive and do not establish causal demographic effects.
