import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useContext(AuthContext);
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'signup') {
        await signup(formData);
      } else {
        await login({ username: formData.username, password: formData.password });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">{mode === 'login' ? 'Login to CHEF' : 'Create Account'}</h2>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="form-input" 
                required 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
          )}
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Enter username" 
              className="form-input" 
              required 
              value={formData.username} 
              onChange={e => setFormData({ ...formData, username: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              className="form-input" 
              required 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-primary btn-full">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          <span>{mode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
          <button className="btn-link" onClick={handleToggle}>
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
