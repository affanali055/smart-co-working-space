import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SpaceDetail from './pages/SpaceDetail';
import Dashboards from './pages/Dashboards';
import Login from './pages/Login';
import Register from './pages/Register';

// Toast rendering layout wrapper
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-alert ${t.type}`} onClick={() => removeToast(t.id)} style={{ cursor: 'pointer' }}>
          <span className="material-symbols-outlined">
            {t.type === 'success' ? 'check_circle' : t.type === 'danger' ? 'error' : t.type === 'warning' ? 'warning' : 'info'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

// Route wrapper to require login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/space/:id" element={<SpaceDetail />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboards />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
