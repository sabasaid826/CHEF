import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import RecipeModal from '../components/RecipeModal';
import foodFacts from '../data/foodFacts';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Home() {
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const greeting = useMemo(() => getGreeting(), []);

  // Pick one fact per day using a deterministic daily index
  const dailyFact = useMemo(() => {
    const now = new Date();
    const dayIndex = Math.floor(now.getTime() / 86400000); // days since epoch
    return foodFacts[dayIndex % foodFacts.length];
  }, []);

  useEffect(() => {
    api.get('/recipes/daily')
      .then(data => {
        setDailyRecipe(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSaveRecipe = async () => {
    if (!dailyRecipe) return;
    try {
      await api.post('/recipes/save', {
        title: dailyRecipe.title,
        image_url: dailyRecipe.image_url || null,
        summary: dailyRecipe.summary || null,
        ingredients: (dailyRecipe.ingredients || []).join(', '),
        instructions: dailyRecipe.instructions || null,
        calories: dailyRecipe.nutrition?.calories || null,
        protein_g: dailyRecipe.nutrition?.protein_g || null,
        carbs_g: dailyRecipe.nutrition?.carbs_g || null,
        fat_g: dailyRecipe.nutrition?.fat_g || null,
        ready_in_minutes: dailyRecipe.ready_in_minutes || null,
        servings: dailyRecipe.servings || null,
      });
      alert(`"${dailyRecipe.title}" saved!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const quickActions = [
    { icon: '🧪', label: 'By Ingredients', desc: 'Cook with what you have', path: '/ingredients' },
    { icon: '📖', label: 'Browse Recipes', desc: 'Explore our collection', path: '/recipes' },
    { icon: '📸', label: 'Food Detection', desc: 'Identify food by image', path: '/detection' },
    { icon: '🎯', label: 'Calorie Profile', desc: 'Track your daily goals', path: '/tdee' },
    { icon: '📅', label: 'Meal Planner', desc: 'Plan your weekly meals', path: '/planner' },
    { icon: '💾', label: 'Saved Recipes', desc: 'Your bookmarked favorites', path: '/saved' },
  ];

  return (
    <section className="page active">
      <div className="kitchen-hero-header">
        <div className="hero-particles">
          <span className="particle"></span>
          <span className="particle"></span>
          <span className="particle"></span>
          <span className="particle"></span>
          <span className="particle"></span>
        </div>
        <h1>{username ? `${greeting}, Chef ${username}!` : 'Welcome to the Kitchen'}</h1>
        <p className="subtitle">Your AI-powered culinary companion</p>
      </div>

      {/* ── Recipe of the Day + Fun Fact ── */}
      <div className="kitchen-layout">
        <div className="kitchen-main-col">
          <h2 className="section-title">✨ Recipe of the Day</h2>
          <div className="card glass daily-recipe-card">
            {loading ? (
              <div style={{ padding: '20px' }}>
                <div className="skeleton" style={{ height: '200px', marginBottom: '16px' }}></div>
                <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '10px' }}></div>
                <div className="skeleton" style={{ height: '14px', width: '80%' }}></div>
              </div>
            ) : error ? (
              <div style={{ padding: '20px', color: 'var(--accent-1)', textAlign: 'center' }}>{error}</div>
            ) : dailyRecipe && (
              <>
                {dailyRecipe.image_url && <img className="recipe-image" style={{ maxHeight: '250px', objectFit: 'cover' }} src={dailyRecipe.image_url} alt={dailyRecipe.title} />}
                <div className="recipe-info" style={{ padding: '20px' }}>
                  <div className="recipe-title" style={{ fontSize: '1.5rem' }}>{dailyRecipe.title}</div>
                  {dailyRecipe.summary && <div className="recipe-summary" dangerouslySetInnerHTML={{ __html: dailyRecipe.summary }} style={{ marginBottom: '15px' }}></div>}
                  {dailyRecipe.diets?.length > 0 && (
                    <div className="diet-tags" style={{ marginBottom: '15px' }}>
                      {dailyRecipe.diets.map(d => <span key={d} className="diet-tag">{d}</span>)}
                    </div>
                  )}
                  <div className="recipe-meta" style={{ marginBottom: '15px' }}>
                    {dailyRecipe.ready_in_minutes && <span className="recipe-meta-item">⏱️ <span className="value">{dailyRecipe.ready_in_minutes} min</span></span>}
                    {dailyRecipe.nutrition?.calories && <span className="recipe-meta-item">🔥 <span className="value">{dailyRecipe.nutrition.calories} kcal</span></span>}
                    {dailyRecipe.servings && <span className="recipe-meta-item">🍽️ <span className="value">{dailyRecipe.servings} servings</span></span>}
                  </div>
                  {dailyRecipe.video_url && (
                    <div className="recipe-video" style={{ marginBottom: '15px' }}>
                      <iframe
                        src={dailyRecipe.video_url}
                        title={`${dailyRecipe.title} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', border: 'none' }}
                      ></iframe>
                    </div>
                  )}
                  <div className="recipe-actions">
                    <button className="btn-primary" onClick={() => setModalOpen(true)}>Let's Cook</button>
                    <button className="btn-secondary" onClick={handleSaveRecipe}>💾 Bookmark</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="kitchen-side-col">
          <h2 className="section-title">💡 Did You Know?</h2>
          <div className="card glass fun-fact-card">
            <div className="fun-fact-icon">{dailyFact.icon}</div>
            <div className="fun-fact-body">
              <span className="fun-fact-category">{dailyFact.category}</span>
              <p className="fun-fact-text">{dailyFact.fact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <h2 className="section-title" style={{ marginTop: '2rem' }}>🚀 Explore</h2>
      <div className="quick-actions-grid">
        {quickActions.map(action => (
          <button
            key={action.path}
            className="quick-action-card card glass"
            onClick={() => navigate(action.path)}
          >
            <span className="qa-icon">{action.icon}</span>
            <span className="qa-label">{action.label}</span>
            <span className="qa-desc">{action.desc}</span>
          </button>
        ))}
      </div>
      
      {isModalOpen && dailyRecipe && (
        <RecipeModal recipe={dailyRecipe} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}
