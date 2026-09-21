import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  User, 
  HelpCircle, 
  Grid, 
  List, 
  Columns2,
  RefreshCw,
  Scale,
  Palette,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers,
  Tag,
  Check
} from 'lucide-react';

const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Children's", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

const GENRE_SHORTCUTS = [
  { label: "All", genres: [] },
  { label: "Sci-Fi & Action", genres: ["Sci-Fi", "Action", "Thriller"] },
  { label: "Drama & Romance", genres: ["Drama", "Romance"] },
  { label: "Animation & Family", genres: ["Animation", "Children's", "Musical"] },
  { label: "Classic Noir & Crime", genres: ["Film-Noir", "Mystery", "Crime"] },
];

export default function StudioTab({ 
  personas, 
  activeUserId, 
  setActiveUserId, 
  recsData, 
  loading, 
  weights, 
  setWeights, 
  selectedGenres,
  setSelectedGenres,
  genreMode,
  setGenreMode,
  onExplain,
  status
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'comparator' | 'table'
  const [customUserIdInput, setCustomUserIdInput] = useState(activeUserId.toString());

  const maxUsers = status?.dataset?.users || 30000;

  useEffect(() => {
    setCustomUserIdInput(activeUserId.toString());
  }, [activeUserId]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const id = parseInt(customUserIdInput, 10);
    if (!isNaN(id) && id >= 1 && id <= maxUsers) {
      setActiveUserId(id);
    }
  };

  const applyPreset = (preset) => {
    if (preset === 'default') {
      setWeights({ ...weights, div_w: 0.12, fair_w: 0.08, pop_w: 0.10 });
    } else if (preset === 'fairness') {
      setWeights({ ...weights, div_w: 0.10, fair_w: 0.35, pop_w: 0.25 });
    } else if (preset === 'diversity') {
      setWeights({ ...weights, div_w: 0.40, fair_w: 0.05, pop_w: 0.05 });
    } else if (preset === 'baseline') {
      setWeights({ ...weights, div_w: 0.0, fair_w: 0.0, pop_w: 0.0 });
    }
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const userProfile = recsData?.user_profile;
  const recommendations = recsData?.fairlens || [];
  const baseline = recsData?.baseline || [];
  const stats = recsData?.stats || {};

  const baselineIds = new Set(baseline.map((m) => m.movie_id));

  return (
    <div className="animate-fade-in studio-layout">
      {/* Left Control Panel */}
      <div className="glass-panel controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Persona Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <User size={18} color="var(--accent-primary)" />
              <span>User Profile & Persona</span>
            </h3>
            <span className="badge badge-indigo">1 - {maxUsers.toLocaleString()} Users</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Select an active evaluation persona or enter any User ID:
          </p>

          <div className="persona-list">
            {personas && personas.map((p) => {
              const isActive = activeUserId === p.user_id;
              return (
                <div
                  key={p.id}
                  className={`persona-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveUserId(p.user_id)}
                >
                  <div 
                    className="persona-avatar-initials" 
                    style={{ 
                      borderColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.12)',
                      background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: p.color || 'var(--accent-cyan)'
                    }}
                  >
                    {p.avatar || 'US'}
                  </div>
                  <div className="persona-info">
                    <div className="persona-name">{p.name}</div>
                    <div className="persona-tagline">{p.tagline}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              type="number"
              min="1"
              max={maxUsers}
              value={customUserIdInput}
              onChange={(e) => setCustomUserIdInput(e.target.value)}
              placeholder={`User ID (1 - ${maxUsers})`}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Load</button>
          </form>
        </div>

        <div className="divider" />

        {/* Custom Genre Selection & Steering */}
        <div className="genre-selector-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <Tag size={18} color="var(--accent-cyan)" />
              <span>Genre Focus & Steering</span>
            </h3>
            {selectedGenres.length > 0 && (
              <span className="badge badge-cyan">{selectedGenres.length} Selected</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Steering Mode:</span>
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${genreMode === 'filter' ? 'active' : ''}`}
                onClick={() => setGenreMode('filter')}
                title="Only recommend movies that include selected genres"
              >
                Strict Filter
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${genreMode === 'boost' ? 'active' : ''}`}
                onClick={() => setGenreMode('boost')}
                title="Boost candidate score for selected genres while maintaining discovery"
              >
                Affinity Boost
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
            {GENRE_SHORTCUTS.map((sc) => {
              const isAll = sc.genres.length === 0 && selectedGenres.length === 0;
              const isMatch = sc.genres.length > 0 && sc.genres.every((g) => selectedGenres.includes(g)) && selectedGenres.length === sc.genres.length;
              return (
                <button
                  key={sc.label}
                  type="button"
                  className={`btn btn-secondary btn-sm ${isAll || isMatch ? 'btn-active' : ''}`}
                  onClick={() => setSelectedGenres(sc.genres)}
                  style={{ fontSize: '0.7rem', padding: '3px 7px' }}
                >
                  {sc.label}
                </button>
              );
            })}
            {selectedGenres.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedGenres([])}
                style={{ fontSize: '0.7rem', padding: '3px 7px', color: 'var(--accent-rose)' }}
                title="Clear selected genres"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Interactive 18 Genre Chips */}
          <div className="genre-chips-container" style={{ marginTop: '8px' }}>
            {ALL_GENRES.map((g) => {
              const isSelected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  className={`genre-chip-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleGenre(g)}
                >
                  {isSelected && <Check size={11} color="var(--accent-cyan)" />}
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {selectedGenres.length === 0 
              ? "All 18 genres active in candidate pool." 
              : `${genreMode === 'filter' ? 'Strictly filtering' : 'Prioritizing'} recommendations matching: ${selectedGenres.join(', ')}`}
          </div>
        </div>

        <div className="divider" />

        {/* Real-time Weight Tuning */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <SlidersHorizontal size={18} color="var(--accent-primary)" />
              <span>Multi-Objective Weights</span>
            </h3>
            <span className="badge badge-emerald">Real-time Engine</span>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('default')} style={{ fontSize: '0.75rem', gap: '5px' }}>
              <Scale size={13} color="var(--accent-primary)" />
              <span>Balanced Hybrid</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('fairness')} style={{ fontSize: '0.75rem', gap: '5px' }}>
              <ShieldCheck size={13} color="var(--accent-emerald)" />
              <span>High Fairness</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('diversity')} style={{ fontSize: '0.75rem', gap: '5px' }}>
              <Layers size={13} color="var(--accent-amber)" />
              <span>High Diversity</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('baseline')} style={{ fontSize: '0.75rem', gap: '5px' }}>
              <Zap size={13} color="var(--accent-cyan)" />
              <span>Pure Baseline</span>
            </button>
          </div>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Diversity Weight */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Palette size={14} color="var(--accent-amber)" />
                  Diversity Weight (&lambda;<sub>div</sub>)
                </span>
                <span className="slider-val">{weights.div_w.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={weights.div_w}
                onChange={(e) => setWeights({ ...weights, div_w: parseFloat(e.target.value) })}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Reward genre novelty & intra-list variety
              </div>
            </div>

            {/* Fairness Weight */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Scale size={14} color="var(--accent-emerald)" />
                  Fairness Bonus (&lambda;<sub>fair</sub>)
                </span>
                <span className="slider-val">{weights.fair_w.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={weights.fair_w}
                onChange={(e) => setWeights({ ...weights, fair_w: parseFloat(e.target.value) })}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Boost exposure for long-tail & mid-tier catalog items
              </div>
            </div>

            {/* Popularity Penalty */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingDown size={14} color="var(--accent-rose)" />
                  Popularity Penalty (&lambda;<sub>pop</sub>)
                </span>
                <span className="slider-val">{weights.pop_w.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={weights.pop_w}
                onChange={(e) => setWeights({ ...weights, pop_w: parseFloat(e.target.value) })}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Penalize superstar blockbuster concentration
              </div>
            </div>

            {/* Top-K */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Top-K Recommendations</span>
                <span className="slider-val">{weights.top_k} items</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={weights.top_k}
                onChange={(e) => setWeights({ ...weights, top_k: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
        </div>

        {/* User Profile Mini Card */}
        {userProfile && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginTop: 'auto'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Active User Demographics
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              User #{userProfile.user.user_id} &bull; {userProfile.user.gender_desc}, {userProfile.user.age_desc}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {userProfile.user.occupation_desc}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
              {userProfile.favorite_genres.slice(0, 4).map((g) => (
                <span key={g} className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Results & Studio Content Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* KPI Strip & View Mode Switcher Header */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Blockbuster Share
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>
                  {((stats.baseline_exposure?.popular || 0) * 100).toFixed(0)}%
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&rarr;</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6EE7B7' }}>
                  {((stats.fairlens_exposure?.popular || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Long-Tail Share
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {((stats.baseline_exposure?.less_popular || 0) * 100).toFixed(0)}%
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&rarr;</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6EE7B7' }}>
                  {((stats.fairlens_exposure?.less_popular || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Intra-List Diversity
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {stats.baseline_diversity?.toFixed(3) || '0.000'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&rarr;</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6EE7B7' }}>
                  {stats.fairlens_diversity?.toFixed(3) || '0.000'}
                </span>
              </div>
            </div>
          </div>

          {/* View Switcher Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`nav-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Cards Grid View with Explainability"
            >
              <Grid size={15} />
              <span>Cards Grid</span>
            </button>
            <button
              className={`nav-tab-btn ${viewMode === 'comparator' ? 'active' : ''}`}
              onClick={() => setViewMode('comparator')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Side-by-Side Baseline vs FairLens Comparison"
            >
              <Columns2 size={15} />
              <span>Comparator</span>
            </button>
            <button
              className={`nav-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Compact Tabular List"
            >
              <List size={15} />
              <span>Compact List</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        {loading ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Computing multi-objective re-ranking & candidate scoring...</div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div>No recommendations found for the selected criteria. Try adjusting genre filters or user ID.</div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="recs-grid">
            {recommendations.map((m) => {
              const popGroup = m.popularity_group;
              const popBadgeClass = popGroup === 'popular' ? 'badge-popular' : popGroup === 'medium' ? 'badge-medium' : 'badge-less_popular';
              const dotClass = popGroup === 'popular' ? 'tier-dot-popular' : popGroup === 'medium' ? 'tier-dot-medium' : 'tier-dot-less_popular';
              const popLabel = popGroup === 'popular' ? 'Popular Tier' : popGroup === 'medium' ? 'Mid-Tier Catalog' : 'Long-Tail Discovery';

              return (
                <div key={m.movie_id} className="rec-card animate-fade-in">
                  <div className="rec-card-header">
                    <div className="rec-rank-badge">#{m.rank}</div>
                    <span className={`badge ${popBadgeClass}`}>
                      <span className={`tier-dot ${dotClass}`}></span>
                      <span>{popLabel}</span>
                    </span>
                  </div>

                  <div className="rec-title">{m.clean_title || m.title}</div>
                  <div className="rec-year">{m.year ? `(${m.year})` : ''}</div>

                  <div className="rec-genres">
                    {m.genre_list && m.genre_list.map((g) => {
                      const isCustomSelected = selectedGenres.includes(g);
                      return (
                        <span 
                          key={g} 
                          className="rec-genre-tag"
                          style={isCustomSelected ? { background: 'rgba(99, 102, 241, 0.25)', borderColor: 'var(--accent-primary)', color: '#C7D2FE', fontWeight: 600 } : undefined}
                        >
                          {g}
                        </span>
                      );
                    })}
                  </div>

                  {/* Score Breakdown Bar */}
                  {m.score_components && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Final Score: <strong>{m.final_score.toFixed(3)}</strong></span>
                        <span>ALS: {m.prediction.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${Math.min(m.score_components.relevance * 100, 100)}%`, background: 'var(--accent-primary)' }} title={`Relevance: ${m.score_components.relevance}`} />
                        <div style={{ width: `${Math.min(m.score_components.fairness_bonus * 300, 100)}%`, background: 'var(--accent-emerald)' }} title={`Fairness Bonus: ${m.score_components.fairness_bonus}`} />
                        <div style={{ width: `${Math.min(m.score_components.diversity_bonus * 300, 100)}%`, background: 'var(--accent-amber)' }} title={`Diversity Bonus: ${m.score_components.diversity_bonus}`} />
                        {m.score_components.custom_genre_bonus > 0 && (
                          <div style={{ width: `${Math.min(m.score_components.custom_genre_bonus * 400, 100)}%`, background: 'var(--accent-cyan)' }} title={`Genre Bonus: ${m.score_components.custom_genre_bonus}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Explainability Trigger Button */}
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => onExplain(m)}
                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center', fontSize: '0.75rem', gap: '6px' }}
                  >
                    <HelpCircle size={13} />
                    <span>Explain Decision Rationale</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'comparator' ? (
          /* Side-by-Side Comparator View */
          <div className="comparator-grid">
            {/* Baseline Column */}
            <div className="comparator-column">
              <div className="comparator-header">
                <div>
                  <div className="badge badge-rose" style={{ marginBottom: '6px' }}>Baseline Model</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Standard Spark ALS</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Top items purely by dot-product predicted rating</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-indigo">{baseline.length} items</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {baseline.map((m) => (
                  <div key={m.movie_id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        #{m.rank}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {m.genres}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${m.popularity_group === 'popular' ? 'badge-popular' : m.popularity_group === 'medium' ? 'badge-medium' : 'badge-less_popular'}`}>
                        {m.popularity_group === 'popular' ? 'Popular' : m.popularity_group === 'medium' ? 'Mid-Tier' : 'Discovery'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FairLens Re-ranked Column */}
            <div className="comparator-column" style={{ borderColor: 'var(--border-highlight)' }}>
              <div className="comparator-header">
                <div>
                  <div className="badge badge-emerald" style={{ marginBottom: '6px' }}>FairLens Optimized</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Multi-Objective Re-Ranker</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Relevance, diversity, and catalog equity re-ranked</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-emerald">{recommendations.length} items</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.map((m) => {
                  const wasInBaseline = baselineIds.has(m.movie_id);
                  const isNewDiscovery = !wasInBaseline;

                  return (
                    <div key={m.movie_id} style={{
                      background: isNewDiscovery ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: isNewDiscovery ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-emerald))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#FFF'
                        }}>
                          #{m.rank}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</span>
                            {isNewDiscovery && (
                              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '1px 5px', gap: '3px' }}>
                                <ArrowUpRight size={10} />
                                Promoted Item
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.genres}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className={`badge ${m.popularity_group === 'popular' ? 'badge-popular' : m.popularity_group === 'medium' ? 'badge-medium' : 'badge-less_popular'}`}>
                          {m.popularity_group === 'popular' ? 'Popular' : m.popularity_group === 'medium' ? 'Mid-Tier' : 'Discovery'}
                        </span>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => onExplain(m)}
                          style={{ padding: '4px 8px' }}
                          title="Explain decision"
                        >
                          <HelpCircle size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Compact Table View */
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px' }}>Rank</th>
                  <th style={{ padding: '10px' }}>Title</th>
                  <th style={{ padding: '10px' }}>Genres</th>
                  <th style={{ padding: '10px' }}>Tier</th>
                  <th style={{ padding: '10px' }}>ALS Score</th>
                  <th style={{ padding: '10px' }}>FairLens Score</th>
                  <th style={{ padding: '10px' }}>Explain</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((m) => (
                  <tr key={m.movie_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>#{m.rank}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{m.clean_title || m.title} {m.year && `(${m.year})`}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.genres}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${m.popularity_group === 'popular' ? 'badge-popular' : m.popularity_group === 'medium' ? 'badge-medium' : 'badge-less_popular'}`}>
                        {m.popularity_group === 'popular' ? 'Popular Tier' : m.popularity_group === 'medium' ? 'Mid-Tier' : 'Long-Tail'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{m.prediction.toFixed(3)}</td>
                    <td style={{ padding: '10px', color: '#6EE7B7', fontWeight: 700 }}>{m.final_score.toFixed(3)}</td>
                    <td style={{ padding: '10px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => onExplain(m)}>
                        Explain
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
