import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Ingredients() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!text.trim()) {
      setError('Please enter some ingredients first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/ingredients/parse', { text });
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRecipes = () => {
    if (results && results.ingredient_names.length > 0) {
      navigate('/recipes', { state: { ingredients: results.ingredient_names.join(', ') } });
    }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <h1>Enter Ingredients</h1>
        <p className="subtitle">Type what you have and we'll find recipes for you</p>
      </div>

      <div className="card glass">
        <textarea 
          placeholder="Enter ingredients, e.g.:&#10;2 cups atta (wheat flour)&#10;1 cup chana dal&#10;potatoes, onion, tomato&#10;paneer, green chili, cumin" 
          rows="6"
          value={text}
          onChange={e => setText(e.target.value)}
        ></textarea>
        {error && <div style={{color: 'red', marginTop: '10px'}}>{error}</div>}
        <button className={`btn-primary \${loading ? 'loading' : ''}`} onClick={handleParse} disabled={loading}>
          <span className="btn-icon">🔍</span> Analyze
        </button>
      </div>

      <div className="results-area">
        {results && results.ingredients.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🤷</span>
            <p>No ingredients found. Try something like "2 cups flour, 3 eggs"</p>
          </div>
        )}

        {results && results.ingredients.length > 0 && (
          <>
            <table className="ingredient-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Raw Text</th>
                </tr>
              </thead>
              <tbody>
                {results.ingredients.map((ing, i) => (
                  <tr key={i}>
                    <td className="ingredient-name">{ing.name}</td>
                    <td>{ing.quantity !== null ? ing.quantity : '—'}</td>
                    <td>{ing.unit ? ing.unit : '—'}</td>
                    <td>{ing.raw_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="search-from-parsed" style={{marginTop: '20px'}}>
              <button className="btn-secondary" onClick={handleSearchRecipes}>
                🍽️ Find recipes with these ingredients
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
