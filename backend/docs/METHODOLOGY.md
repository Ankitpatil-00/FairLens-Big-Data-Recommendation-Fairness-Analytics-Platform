# Methodology

An 80/20 seeded random split trains the Spark MLlib ALS model. The baseline ranks ALS predictions. FairLens starts with the same candidate set and greedily maximizes:

`normalized relevance + diversity_weight × new-genre bonus + fairness_weight × long-tail bonus − popularity_weight × popular-item penalty`.

Relevance is dominant by design. This is a proposed engineering baseline, not a novel algorithm. Every moved item stores its numeric contributing factors.
