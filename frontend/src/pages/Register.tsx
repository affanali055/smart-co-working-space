import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'user' | 'owner'>('user');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    setLoading(true);
    const success = await register({
      full_name: fullName,
      email,
      phone: phone || undefined,
      role,
      password
    });
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="glow-blob purple" style={{ top: '30%', right: '35%', width: '300px', height: '300px' }}></div>
      
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
          Select your platform role and begin exploring.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label className="filter-label">Full Name</label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="e.g. John Doe" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Email Address</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="e.g. john@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="filter-group">
              <label className="filter-label">Phone Number</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Optional" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Account Role</label>
              <select 
                className="input-field" 
                value={role} 
                onChange={e => setRole(e.target.value as 'user' | 'owner')}
              >
                <option value="user">Workspace Client</option>
                <option value="owner">Space Provider</option>
              </select>
            </div>
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
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#60a5fa', fontWeight: '600' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
