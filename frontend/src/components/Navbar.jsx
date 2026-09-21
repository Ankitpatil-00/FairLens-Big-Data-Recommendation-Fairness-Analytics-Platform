import React from 'react';
import { 
  SlidersHorizontal, 
  Scale, 
  Film,
  Activity,
  Database,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, status }) {
  const tabs = [
    { id: 'studio', label: 'Recommendation Studio', icon: SlidersHorizontal },
    { id: 'fairness', label: 'Fairness & Bias Lab', icon: Scale },
    { id: 'catalog', label: 'Dataset Catalog', icon: Film },
  ];

  const ratingsCount = status?.dataset?.ratings || 5800000;
  const formattedRatings = `${(ratingsCount / 1000000).toFixed(1)}M`;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="nav-brand" onClick={() => setActiveTab('studio')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <div className="brand-title">FairLens</div>
            <div className="brand-subtitle">PySpark Fairness-Aware Recommendation Platform</div>
          </div>
        </div>

        {/* 3 Streamlined Tabs */}
        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="nav-status-badge" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' }}>
            <Database size={14} />
            <span>{formattedRatings} Ratings Big Data</span>
          </div>

          <div className="nav-status-badge">
            <span className="status-dot animate-pulse"></span>
            <Activity size={14} />
            <span>ALS 20 Factors Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
