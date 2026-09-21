import React from 'react';
import { X, HelpCircle, Check } from 'lucide-react';

export default function ExplainabilityModal({ movie, onClose, userProfile }) {
  if (!movie) return null;

  const comps = movie.score_components || {
    relevance: movie.prediction ? movie.prediction / 5.0 : 0.8,
    fairness_bonus: movie.popularity_group === 'less_popular' ? 0.08 : 0.0,
    diversity_bonus: 0.05,
    popularity_penalty: movie.popularity_group === 'popular' ? 0.10 : 0.0,
    custom_genre_bonus: 0.0,
  };

  const userGenres = new Set(userProfile?.favorite_genres || []);
  const movieGenres = movie.genre_list || [];
  const matchingGenres = movieGenres.filter(g => userGenres.has(g));

  const popGroup = movie.popularity_group;
  const popBadgeClass = popGroup === 'popular' ? 'badge-popular' : popGroup === 'medium' ? 'badge-medium' : 'badge-less_popular';
  const dotClass = popGroup === 'popular' ? 'tier-dot-popular' : popGroup === 'medium' ? 'tier-dot-medium' : 'tier-dot-less_popular';
  const popLabel = popGroup === 'popular' ? 'Popular Tier' : popGroup === 'medium' ? 'Mid-Tier Catalog' : 'Long-Tail Discovery';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div className="badge badge-indigo">
            <HelpCircle size={12} />
            <span>Explainability Inspector</span>
          </div>
          <span className={`badge ${popBadgeClass}`}>
            <span className={`tier-dot ${dotClass}`}></span>
            <span>{popLabel}</span>
          </span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          {movie.clean_title || movie.title} {movie.year && `(${movie.year})`}
        </h2>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {movieGenres.map((g) => {
            const isMatch = matchingGenres.includes(g);
            return (
              <span key={g} className="genre-chip" style={{
                background: isMatch ? 'rgba(99, 102, 241, 0.25)' : undefined,
                borderColor: isMatch ? 'var(--accent-primary)' : undefined,
                color: isMatch ? '#C7D2FE' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isMatch && <Check size={11} color="var(--accent-cyan)" />}
                <span>{g}</span>
              </span>
            );
          })}
        </div>

        {/* Natural Language Justification */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
            Decision Rationale
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {movie.explanation || movie.rerank_reason || "Ranked high based on personalized collaborative filtering score and diversity incentive."}
          </p>
        </div>

        {/* Mathematical Waterfall Breakdown */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
          Multi-Objective Score Components
        </h3>

        <div className="waterfall-bar-wrap">
          <div className="waterfall-row">
            <span className="waterfall-label">Relevance (ALS)</span>
            <div className="waterfall-track">
              <div className="waterfall-fill" style={{ width: `${Math.min(comps.relevance * 100, 100)}%`, background: 'var(--accent-primary)' }} />
            </div>
            <span className="waterfall-val" style={{ color: 'var(--accent-primary)' }}>+{comps.relevance.toFixed(3)}</span>
          </div>

          <div className="waterfall-row">
            <span className="waterfall-label">Fairness Bonus</span>
            <div className="waterfall-track">
              <div className="waterfall-fill" style={{ width: `${Math.min(comps.fairness_bonus * 500, 100)}%`, background: '#10B981' }} />
            </div>
            <span className="waterfall-val" style={{ color: '#6EE7B7' }}>+{comps.fairness_bonus.toFixed(3)}</span>
          </div>

          <div className="waterfall-row">
            <span className="waterfall-label">Diversity Bonus</span>
            <div className="waterfall-track">
              <div className="waterfall-fill" style={{ width: `${Math.min(comps.diversity_bonus * 500, 100)}%`, background: 'var(--accent-amber)' }} />
            </div>
            <span className="waterfall-val" style={{ color: '#FCD34D' }}>+{comps.diversity_bonus.toFixed(3)}</span>
          </div>

          {comps.custom_genre_bonus > 0 && (
            <div className="waterfall-row">
              <span className="waterfall-label">Genre Bonus</span>
              <div className="waterfall-track">
                <div className="waterfall-fill" style={{ width: `${Math.min(comps.custom_genre_bonus * 500, 100)}%`, background: 'var(--accent-cyan)' }} />
              </div>
              <span className="waterfall-val" style={{ color: '#67E8F9' }}>+{comps.custom_genre_bonus.toFixed(3)}</span>
            </div>
          )}

          <div className="waterfall-row">
            <span className="waterfall-label">Popularity Penalty</span>
            <div className="waterfall-track">
              <div className="waterfall-fill" style={{ width: `${Math.min(comps.popularity_penalty * 500, 100)}%`, background: '#EF4444' }} />
            </div>
            <span className="waterfall-val" style={{ color: '#F87171' }}>-{comps.popularity_penalty.toFixed(3)}</span>
          </div>
        </div>

        {/* Total Composite Score */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Final Re-ranked Score</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rank Position: #{movie.rank}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#6EE7B7' }}>
            {movie.final_score?.toFixed(3) || movie.prediction?.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
