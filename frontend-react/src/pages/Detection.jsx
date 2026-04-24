import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Detection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('chef_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const res = await fetch('/api/detect/image', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <h1>Food Detection (ML)</h1>
        <p className="subtitle">Upload a photo to detect food items using Computer Vision (YOLOv8)</p>
      </div>

      <div className="card glass">
        <input 
          type="file" 
          accept="image/*" 
          style={{display: 'none'}} 
          ref={fileInputRef}
          onChange={handleFileChange} 
        />
        <div 
          className="upload-area" 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={file ? { border: '2px solid var(--primary-color)' } : {}}
        >
          <span className="upload-icon">📸</span>
          <h3>Click or Drag to Upload</h3>
          <p className="upload-hint">Supports JPG, PNG (Max 5MB)</p>
          {file && <div className="selected-file">{file.name}</div>}
        </div>
        <button 
          className={`btn-primary btn-full ${loading ? 'loading' : ''}`} 
          onClick={handleDetect} 
          disabled={!file || loading}
          style={{marginTop: '15px'}}
        >
          Analyze Image
        </button>
      </div>

      <div className="results-area">
        {error && <div style={{color: 'red'}}>{error}</div>}
        {results && (
          <div>
            <h3 style={{marginBottom: '12px'}}>Detected Ingredients</h3>
            <span className="source-badge" style={{marginBottom: '12px', display: 'inline-block'}}>
              Method: {results.method} · {results.message}
            </span>
            <div className="detection-card" style={{padding: '15px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', marginBottom: '15px'}}>
              {results.detected_foods && results.detected_foods.length > 0 ? (
                <ul style={{listStyleType: 'none', padding: 0}}>
                  {results.detected_foods.map((item, idx) => (
                    <li key={idx} style={{textTransform: 'capitalize', padding: '8px 0', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontWeight: 500}}>{item.label}</span>
                      <span className="match-badge" style={{fontSize: '11px'}}>{Math.round(item.confidence * 100)}% confidence</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{color: 'var(--text-muted)'}}>No food items detected clearly. Try a clearer image with visible food.</p>
              )}
            </div>
            {results.ingredients && results.ingredients.length > 0 && (
              <div className="search-from-parsed">
                <button className="btn-secondary" onClick={() => navigate('/recipes', { state: { ingredients: results.ingredients.join(', ') } })}>
                  🍽️ Search Recipes with these ingredients
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
