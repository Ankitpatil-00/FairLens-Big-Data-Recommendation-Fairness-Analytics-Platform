import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Database,
  Star
} from 'lucide-react';

export default function CatalogTab({ status }) {
  const [moviesData, setMoviesData] = useState({ total: 0, movies: [], total_pages: 1, page: 1 });
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [popularity, setPopularity] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const genres = status?.dataset?.genres || [
    "Action", "Adventure", "Animation", "Children's", "Comedy", "Crime",
    "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
    "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
  ];

  const totalRatings = status?.dataset?.ratings || 5800000;
  const totalUsers = status?.dataset?.users || 30000;
  const totalMovies = status?.dataset?.movies || 7500;

  const genreCounts = [
    { genre: "Drama", count: Math.round(totalMovies * 0.413), pct: 41.3 },
    { genre: "Comedy", count: Math.round(totalMovies * 0.309), pct: 30.9 },
    { genre: "Action", count: Math.round(totalMovies * 0.130), pct: 13.0 },
    { genre: "Thriller", count: Math.round(totalMovies * 0.127), pct: 12.7 },
    { genre: "Romance", count: Math.round(totalMovies * 0.121), pct: 12.1 },
    { genre: "Horror", count: Math.round(totalMovies * 0.088), pct: 8.8 },
    { genre: "Adventure", count: Math.round(totalMovies * 0.073), pct: 7.3 },
    { genre: "Sci-Fi", count: Math.round(totalMovies * 0.071), pct: 7.1 },
    { genre: "Children's", count: Math.round(totalMovies * 0.065), pct: 6.5 },
    { genre: "Crime", count: Math.round(totalMovies * 0.054), pct: 5.4 },
    { genre: "War", count: Math.round(totalMovies * 0.037), pct: 3.7 },
    { genre: "Documentary", count: Math.round(totalMovies * 0.033), pct: 3.3 },
    { genre: "Musical", count: Math.round(totalMovies * 0.029), pct: 2.9 },
    { genre: "Mystery", count: Math.round(totalMovies * 0.027), pct: 2.7 },
    { genre: "Animation", count: Math.round(totalMovies * 0.027), pct: 2.7 },
    { genre: "Fantasy", count: Math.round(totalMovies * 0.018), pct: 1.8 },
    { genre: "Western", count: Math.round(totalMovies * 0.018), pct: 1.8 },
    { genre: "Film-Noir", count: Math.round(totalMovies * 0.011), pct: 1.1 }
  ];

  const ratingDist = [
    { stars: 5, count: Math.round(totalRatings * 0.226), pct: 22.6 },
    { stars: 4, count: Math.round(totalRatings * 0.349), pct: 34.9 },
    { stars: 3, count: Math.round(totalRatings * 0.261), pct: 26.1 },
    { stars: 2, count: Math.round(totalRatings * 0.108), pct: 10.8 },
    { stars: 1, count: Math.round(totalRatings * 0.056), pct: 5.6 }
  ];

  const maxGenre = Math.max(...genreCounts.map(g => g.count));

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          query: search,
          genre: genre,
          popularity: popularity,
          page: page.toString(),
          page_size: '24'
        });
        const res = await fetch(`/api/movies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMoviesData(data);
        }
      } catch (e) {
        console.error("Error searching movies:", e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMovies, 180);
    return () => clearTimeout(timer);
  }, [search, genre, popularity, page]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div className="badge badge-cyan" style={{ marginBottom: '10px' }}>
          <Database size={13} />
          <span>Unified MovieLens Big Data Catalog</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Movie Catalog & Content Explorer
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '800px' }}>
          Explore the combined <strong>{totalMovies.toLocaleString()}</strong> movie titles across <strong>18 genres</strong> and <strong>{totalRatings.toLocaleString()}</strong> interactions processed by the PySpark recommendation engine.
        </p>

        {/* Dataset Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>COMBINED RATINGS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{totalRatings.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL USERS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{totalUsers.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL MOVIES</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{totalMovies.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ALS LATENT FACTORS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>20 Dimensions</div>
          </div>
        </div>
      </div>

      {/* Catalog Genre Breakdown & Rating Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Genre Breakdown */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Catalog Genre Distribution</h3>
            <span className="badge badge-indigo">18 Genres</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
            {genreCounts.slice(0, 10).map((g) => (
              <div key={g.genre} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{g.genre}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{g.count} ({g.pct}%)</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(g.count / maxGenre) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Stars Distribution */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rating Distribution (Stars)</h3>
            <span className="badge badge-cyan">1 - 5 Stars</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {ratingDist.map((r) => (
              <div key={r.stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '3px', width: '65px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={11}
                      fill={s <= r.stars ? "var(--accent-amber)" : "transparent"}
                      color={s <= r.stars ? "var(--accent-amber)" : "rgba(255,255,255,0.2)"}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${r.pct * 2.5}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '110px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {r.count.toLocaleString()} ({r.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movie Search & Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search movie title (e.g. Star Wars, Matrix, Cyberpunk)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          </div>

          <select value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }}>
            <option value="">All Genres (18 Genres)</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select value={popularity} onChange={(e) => { setPopularity(e.target.value); setPage(1); }}>
            <option value="">All Popularity Tiers</option>
            <option value="popular">Popular Blockbusters (Top 20%)</option>
            <option value="medium">Mid-Tier Catalog (Next 30%)</option>
            <option value="less_popular">Less-Popular Hidden Gems (Bottom 50%)</option>
          </select>
        </div>
      </div>

      {/* Movie Cards Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Searching {totalMovies.toLocaleString()} movie titles...
        </div>
      ) : moviesData.movies.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
          No movies matching criteria.
        </div>
      ) : (
        <div className="movie-grid">
          {moviesData.movies.map((m) => {
            const popGroup = m.popularity_group;
            const popBadgeClass = popGroup === 'popular' ? 'badge-popular' : popGroup === 'medium' ? 'badge-medium' : 'badge-less_popular';
            const dotClass = popGroup === 'popular' ? 'tier-dot-popular' : popGroup === 'medium' ? 'tier-dot-medium' : 'tier-dot-less_popular';
            const popLabel = popGroup === 'popular' ? 'Popular Tier' : popGroup === 'medium' ? 'Mid-Tier' : 'Hidden Gem';

            return (
              <div key={m.movie_id} className="movie-card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge ${popBadgeClass}`}>
                    <span className={`tier-dot ${dotClass}`}></span>
                    <span>{popLabel}</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {m.rating_count ? `${m.rating_count.toLocaleString()} ratings` : 'Unrated'}
                  </span>
                </div>

                <div className="movie-card-title">{m.clean_title || m.title}</div>
                <div className="movie-card-year">{m.year ? `(${m.year})` : ''}</div>

                <div className="movie-card-genres">
                  {m.genre_list && m.genre_list.map((g) => (
                    <span key={g} className="rec-genre-tag">{g}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {moviesData.total_pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page} of {moviesData.total_pages} ({moviesData.total.toLocaleString()} movies)
          </span>
          <button
            className="pagination-btn"
            disabled={page >= moviesData.total_pages}
            onClick={() => setPage(page + 1)}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
