import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span className="material-symbols-outlined">hub</span>
        NexSpace
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">search</span>
          Explore Spaces
        </Link>
        
        {user && (
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
        )}

        {user ? (
          <div className="nav-user">
            <span className={`user-badge ${user.role}`}>
              {user.role}
            </span>
            <span className="nav-item" style={{ cursor: 'default' }}>
              Hi, {user.full_name.split(' ')[0]}
            </span>
            <button className="nav-btn-secondary" onClick={logout}>
              Log Out
            </button>
          </div>
        ) : (
          <div className="nav-user">
            <Link to="/login">
              <button className="nav-btn-secondary" style={{ marginRight: '12px' }}>
                Log In
              </button>
            </Link>
            <Link to="/register">
              <button className="nav-btn">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
