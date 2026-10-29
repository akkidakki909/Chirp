
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chirp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('token'))
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem('token');

      if (!token) {
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        // Verify that the saved token is still accepted by the server.
        await apiClient.get('/auth/me');

        if (active) {
          const saved = localStorage.getItem('chirp_user');
          setUser(saved ? JSON.parse(saved) : null);
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('chirp_user');

        if (active) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('chirp_user', JSON.stringify(data.user));

    setUser(data.user);
    setIsAuthenticated(true);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('chirp_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    setUser((previous) => {
      if (!previous) return previous;

      const updated = { ...previous, ...updates };
      localStorage.setItem('chirp_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
