import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="glow-blob blue" style={{ top: '30%', left: '35%', width: '300px', height: '300px' }}></div>
      
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
          Log in to explore and reserve workspaces.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label className="filter-label">Email Address</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="e.g. user@cowork.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="filter-group" style={{ marginBottom: '24px' }}>
            <label className="filter-label">Password</label>
            <input 
              type="password" 
              required
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="nav-btn" 
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#60a5fa', fontWeight: '600' }}>
            Sign Up
          </Link>
        </p>

        {/* Demo credentials tip */}
        <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>Demo Accounts:</strong><br />
            • User: <code>user@cowork.com</code> (pwd: <code>user123</code>)<br />
            • Owner: <code>owner@cowork.com</code> (pwd: <code>owner123</code>)<br />
            • Admin: <code>admin@cowork.com</code> (pwd: <code>admin123</code>)
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
