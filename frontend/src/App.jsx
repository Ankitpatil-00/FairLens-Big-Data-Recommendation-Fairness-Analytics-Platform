import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StudioTab from './components/StudioTab';
import FairnessLabTab from './components/FairnessLabTab';
import CatalogTab from './components/CatalogTab';
import ExplainabilityModal from './components/ExplainabilityModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [activeUserId, setActiveUserId] = useState(1);
  const [weights, setWeights] = useState({
    div_w: 0.12,
    fair_w: 0.08,
    pop_w: 0.10,
    top_k: 10,
    candidate_multiplier: 5
  });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genreMode, setGenreMode] = useState('filter'); // 'filter' | 'boost'
  const [recsData, setRecsData] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [modalMovie, setModalMovie] = useState(null);

  // Initial fetch for status, report, personas
  const loadInitialData = useCallback(async () => {
    try {
      const [statusRes, reportRes, personasRes] = await Promise.all([
        fetch('/api/status').catch(() => null),
        fetch('/api/report').catch(() => null),
        fetch('/api/personas').catch(() => null),
      ]);

      if (statusRes && statusRes.ok) setStatus(await statusRes.json());
      if (reportRes && reportRes.ok) setReport(await reportRes.json());
      if (personasRes && personasRes.ok) {
        const pList = await personasRes.json();
        setPersonas(pList);
        if (pList && pList.length > 0) {
          setActiveUserId(pList[0].user_id);
        }
      }
    } catch (err) {
      console.error("Failed to load FairLens data:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch recommendations whenever user, weights, or selected genres change
  const fetchRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          top_k: weights.top_k,
          diversity_weight: weights.div_w,
          fairness_weight: weights.fair_w,
          popularity_weight: weights.pop_w,
          candidate_multiplier: weights.candidate_multiplier,
          selected_genres: selectedGenres,
          genre_mode: genreMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecsData(data);
      }
    } catch (e) {
      console.error("Error generating recommendations:", e);
    } finally {
      setLoadingRecs(false);
    }
  }, [activeUserId, weights, selectedGenres, genreMode]);

  useEffect(() => {
    const timer = setTimeout(fetchRecommendations, 120);
    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        status={status}
      />

      <main className="main-content">
        {activeTab === 'studio' && (
          <StudioTab
            personas={personas}
            activeUserId={activeUserId}
            setActiveUserId={setActiveUserId}
            recsData={recsData}
            loading={loadingRecs}
            weights={weights}
            setWeights={setWeights}
            selectedGenres={selectedGenres}
            setSelectedGenres={setSelectedGenres}
            genreMode={genreMode}
            setGenreMode={setGenreMode}
            onExplain={(movie) => setModalMovie(movie)}
            status={status}
          />
        )}

        {activeTab === 'fairness' && (
          <FairnessLabTab 
            report={report} 
            status={status}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogTab 
            status={status}
          />
        )}
      </main>

      {/* Decision Explainability Modal */}
      {modalMovie && (
        <ExplainabilityModal
          movie={modalMovie}
          userProfile={recsData?.user_profile}
          onClose={() => setModalMovie(null)}
        />
      )}
    </div>
  );
}
