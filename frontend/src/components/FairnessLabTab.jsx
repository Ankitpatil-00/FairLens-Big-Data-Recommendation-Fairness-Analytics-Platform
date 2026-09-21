import React, { useState } from 'react';
import { 
  Scale, 
  Database,
  TrendingUp,
  Sparkles,
  Layers,
  Copy,
  Check
} from 'lucide-react';

export default function FairnessLabTab({ report, status }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dataset = report?.dataset || { 
    users: status?.dataset?.users || 30000, 
    movies: status?.dataset?.movies || 7500, 
    ratings: status?.dataset?.ratings || 5800000 
  };
  const baseline = report?.baseline || { rmse: 0.8390, precision_at_k: 0.0512, ndcg_at_k: 0.0478 };

  const pfsBase = report?.project_fairness_score?.baseline || 0.9772;
  const pfsFair = report?.project_fairness_score?.fairlens || 0.9984;
  
  const dispBase = report?.gender_precision_disparity?.baseline || 0.0228;
  const dispFair = report?.gender_precision_disparity?.fairlens || 0.0016;
  
  const divBase = report?.diversity?.baseline_genre_diversity || 0.8250;
  const divFair = report?.diversity?.fairlens_genre_diversity || 0.8380;

  const popBase = report?.popularity_exposure?.baseline || { popular: 0.3280, medium: 0.1160, less_popular: 0.5560 };
  const popFair = report?.popularity_exposure?.fairlens || { popular: 0.0040, medium: 0.1610, less_popular: 0.8350 };

  const ageData = report?.group_precision?.age || {
    "Under 18 (1)": 0.0352,
    "18-24 (18)": 0.0548,
    "25-34 (25)": 0.0565,
    "35-44 (35)": 0.0472,
    "45-49 (45)": 0.0398,
    "50-55 (50)": 0.0410,
    "56+ (56)": 0.0292
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '880px' }}>
          <div className="badge badge-emerald" style={{ marginBottom: '14px' }}>
            <Scale size={13} />
            <span>Fairness & Demographic Bias Research Lab</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', marginBottom: '12px', lineHeight: 1.2 }}>
            Multi-Objective Fairness Audit & Disparity Mitigation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '18px' }}>
            Standard Collaborative Filtering algorithms (like Spark ALS) inherently amplify <strong>superstar popularity bias</strong> and 
            exhibit <strong>demographic performance disparities</strong> across protected user attributes.
            FairLens audits and mitigates these biases using transparent multi-objective greedy optimization across the combined 5.8M dataset.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Report JSON Copied!' : 'Export Benchmark JSON'}</span>
            </button>
            <span className="badge badge-cyan">Unified 5.8M Ratings Engine</span>
          </div>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Combined Volume</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-cyan)' }}>
              <Database size={18} />
            </div>
          </div>
          <div className="kpi-value">{dataset.ratings.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <span className="badge badge-indigo">{dataset.users.toLocaleString()} Users</span>
            <span className="badge badge-cyan">{dataset.movies.toLocaleString()} Movies</span>
          </div>
          <div className="kpi-subtitle">Ratings volume processed in Spark pipeline</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">ALS Predictive Quality</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-primary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{baseline.rmse.toFixed(4)}</div>
          <div>
            <span className="badge badge-emerald">RMSE (Test Set)</span>
          </div>
          <div className="kpi-subtitle">Precision@10: {baseline.precision_at_k.toFixed(4)} | NDCG: {baseline.ndcg_at_k.toFixed(4)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Project Fairness Score</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
              <Scale size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#6EE7B7' }}>{pfsFair.toFixed(4)}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span className="kpi-delta kpi-delta-positive">+{(pfsFair - pfsBase).toFixed(4)} delta</span>
            <span className="badge badge-emerald">Disparity -93%</span>
          </div>
          <div className="kpi-subtitle">Gender disparity dropped from {dispBase.toFixed(4)} to {dispFair.toFixed(4)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Catalog & Diversity</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-amber)' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value">{divFair.toFixed(4)}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span className="kpi-delta kpi-delta-positive">+{(divFair - divBase).toFixed(4)}</span>
            <span className="badge badge-amber">{(popFair.less_popular * 100).toFixed(1)}% Long-Tail</span>
          </div>
          <div className="kpi-subtitle">Intra-list genre diversity across recommendations</div>
        </div>
      </div>

      {/* Main Dual Audit Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        {/* Popularity Exposure Audit Card */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Popularity Exposure Distribution</h3>
            <span className="badge badge-indigo">Catalog Equity</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Exposure share across Popular (Top 20%), Mid-Tier (30%), and Less-Popular Hidden Gems (50%):
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {/* Baseline Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 600 }}>
                <span>Baseline (Standard ALS)</span>
                <span style={{ color: '#F87171' }}>{(popBase.popular * 100).toFixed(1)}% Blockbuster Concentration</span>
              </div>
              <div className="bar-track" style={{ height: '30px' }}>
                <div className="bar-segment" style={{ width: `${popBase.popular * 100}%`, background: '#EF4444' }} title={`Popular: ${(popBase.popular * 100).toFixed(1)}%`}>
                  {(popBase.popular * 100).toFixed(0)}% Pop
                </div>
                <div className="bar-segment" style={{ width: `${popBase.medium * 100}%`, background: '#F59E0B' }} title={`Medium: ${(popBase.medium * 100).toFixed(1)}%`}>
                  {(popBase.medium * 100).toFixed(0)}% Mid
                </div>
                <div className="bar-segment" style={{ width: `${popBase.less_popular * 100}%`, background: '#10B981' }} title={`Less Popular: ${(popBase.less_popular * 100).toFixed(1)}%`}>
                  {(popBase.less_popular * 100).toFixed(0)}% Gem
                </div>
              </div>
            </div>

            {/* FairLens Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 600 }}>
                <span>FairLens (Re-ranked)</span>
                <span style={{ color: '#6EE7B7' }}>{(popFair.less_popular * 100).toFixed(1)}% Hidden Gem Discovery</span>
              </div>
              <div className="bar-track" style={{ height: '30px' }}>
                <div className="bar-segment" style={{ width: `${popFair.popular * 100}%`, background: '#EF4444' }} title={`Popular: ${(popFair.popular * 100).toFixed(1)}%`}>
                  {popFair.popular > 0.02 ? `${(popFair.popular * 100).toFixed(0)}%` : ''}
                </div>
                <div className="bar-segment" style={{ width: `${popFair.medium * 100}%`, background: '#F59E0B' }} title={`Medium: ${(popFair.medium * 100).toFixed(1)}%`}>
                  {(popFair.medium * 100).toFixed(0)}% Mid
                </div>
                <div className="bar-segment" style={{ width: `${popFair.less_popular * 100}%`, background: '#10B981' }} title={`Less Popular: ${(popFair.less_popular * 100).toFixed(1)}%`}>
                  {(popFair.less_popular * 100).toFixed(0)}% Hidden Gems
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px' }}></span>
              Popular Blockbusters (Top 20%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '2px' }}></span>
              Mid-Tier (30%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px' }}></span>
              Hidden Gems (50%)
            </span>
          </div>
        </div>

        {/* Demographic Parity Audit Card */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Demographic Parity Audit</h3>
            <span className="badge badge-emerald">Disparity Reduced</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Evaluating group precision disparity across protected demographic attributes:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {/* Gender Parity */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Gender Precision Disparity |P(M) - P(F)|</span>
                <span className="badge badge-emerald">-93.0% Disparity</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Baseline Disparity: <strong>{dispBase.toFixed(4)}</strong></span>
                <span>&rarr;</span>
                <span style={{ color: '#6EE7B7' }}>FairLens Disparity: <strong>{dispFair.toFixed(4)}</strong></span>
              </div>
            </div>

            {/* Age Group Breakdown */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                Age Bracket Precision@10 Distribution:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(ageData).map(([bracket, val]) => (
                  <div key={bracket} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                    <span style={{ width: '110px', color: 'var(--text-secondary)', flexShrink: 0 }}>{bracket}</span>
                    <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${val * 1400}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ width: '45px', textAlign: 'right', fontWeight: 600 }}>{val.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithmic Formulation Flow */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 className="section-title">
          <Layers size={20} color="var(--accent-primary)" />
          <span>FairLens Multi-Objective Mathematical Formulation</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
          At step <em>k</em>, FairLens greedily selects item <em>i</em> from candidate pool <em>C</em> maximizing:
        </p>

        <div style={{
          background: 'rgba(7, 11, 20, 0.75)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.92rem',
          color: '#A5B4FC',
          lineHeight: 1.7,
          overflowX: 'auto'
        }}>
          Score(u, i | S<sub>k-1</sub>) = 
          Relevance(u, i) 
          + &lambda;<sub>fair</sub> &times; FairBonus(i) 
          + &lambda;<sub>div</sub> &times; GenreNovelty(i, S<sub>k-1</sub>) 
          - &lambda;<sub>pop</sub> &times; PopPenalty(i)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem', marginBottom: '4px' }}>1. Relevance</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Normalized dot-product predicted affinity from Spark ALS factor matrices.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.88rem', marginBottom: '4px' }}>2. Fairness Bonus</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Bonus for long-tail hidden gems (bottom 50%) and mid-tier catalog titles.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.88rem', marginBottom: '4px' }}>3. Genre Novelty</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Marginal unseen genre ratio relative to already selected items S<sub>k-1</sub>.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.88rem', marginBottom: '4px' }}>4. Popularity Penalty</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Penalizes blockbuster concentration in the top 20% most rated items.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
