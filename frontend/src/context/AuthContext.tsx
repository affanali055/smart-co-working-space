import React, { createContext, useState, useEffect, useContext } from 'react';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'owner' | 'admin';
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  toasts: Toast[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (userCreate: any) => Promise<boolean>;
  logout: () => void;
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ns_token'));
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logout = () => {
    localStorage.removeItem('ns_token');
    setToken(null);
    setUser(null);
    showToast('Successfully logged out.', 'info');
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  // Fetch current user details if token exists
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Standard OAuth2 form request (x-www-form-urlencoded)
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.detail || 'Login failed. Please check credentials.', 'danger');
        return false;
      }

      const data = await res.json();
      localStorage.setItem('ns_token', data.access_token);
      setToken(data.access_token);
      
      // Fetch details immediately
      await fetchCurrentUser(data.access_token);
      showToast('Logged in successfully!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Connection error. Server may be offline.', 'danger');
      return false;
    }
  };

  const register = async (userCreate: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userCreate),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.detail || 'Registration failed.', 'danger');
        return false;
      }

      showToast('Account registered successfully!', 'success');
      // Login automatically
      return await login(userCreate.email, userCreate.password);
    } catch (err) {
      console.error(err);
      showToast('Connection error. Server may be offline.', 'danger');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        toasts,
        login,
        register,
        logout,
        showToast,
        removeToast,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
