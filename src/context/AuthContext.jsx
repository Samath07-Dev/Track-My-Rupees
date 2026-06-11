import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in and verify token validity
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Verify token is still valid
          try {
            const res = await axios.post('http://localhost:5001/api/auth/verify', {}, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000 // 5 second timeout
            });
            
            if (res.data.valid) {
              setUser(JSON.parse(storedUser));
            } else {
              // Token is invalid/expired, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (err) {
            // Only clear storage on 401 (token expired/invalid)
            // On network errors, keep the token - server might be temporarily down
            if (err.response?.status === 401) {
              console.error('Token expired or invalid');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            } else {
              // Server error or network error - keep user logged in
              // They'll stay logged in with the stored token
              console.warn('Token verification skipped (server unavailable), keeping user logged in');
              setUser(storedUser ? JSON.parse(storedUser) : null);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      // First, check if the backend is even responding
      let backendHealthy = false;
      try {
        const healthRes = await axios.get('http://localhost:5001/api/health', {
          timeout: 3000
        });
        backendHealthy = healthRes.data.mongodb === 'connected';
        
        if (!backendHealthy) {
          const dbStatus = healthRes.data.mongodb;
          if (dbStatus === 'disconnected') {
            setError('Backend database is not connected. Please restart the backend server.');
            console.error('Database disconnected');
            return false;
          }
        }
      } catch (healthErr) {
        if (healthErr.code === 'ECONNREFUSED') {
          setError('Backend server is not running. Run "./start-app.sh" to start it.');
        } else if (healthErr.code === 'ECONNABORTED' || healthErr.message.includes('timeout')) {
          setError('Backend server is not responding. Please check if it\'s running.');
        } else {
          setError('Cannot connect to backend server. Make sure it\'s running on port 5001.');
        }
        console.error('Backend health check failed:', healthErr.message);
        return false;
      }

      // If backend is healthy, attempt login
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password }, {
        timeout: 10000
      });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setUser(res.data.user);
      return true;
    } catch (err) {
      let message = 'Login failed';
      
      if (err.response?.status === 503) {
        message = 'Database service is unavailable. Please ensure MongoDB is running and the backend is restarted.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        message = 'Request timeout - backend server is not responding.';
      } else if (err.code === 'ECONNREFUSED') {
        message = 'Cannot connect to backend. Please run "./start-app.sh"';
      }
      
      setError(message);
      console.error('Login error:', message);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      
      // First, check if the backend is even responding
      let backendHealthy = false;
      try {
        const healthRes = await axios.get('http://localhost:5001/api/health', {
          timeout: 3000
        });
        backendHealthy = healthRes.data.mongodb === 'connected';
        
        if (!backendHealthy) {
          const dbStatus = healthRes.data.mongodb;
          if (dbStatus === 'disconnected') {
            setError('Backend database is not connected. Please restart the backend server.');
            return false;
          }
        }
      } catch (healthErr) {
        if (healthErr.code === 'ECONNREFUSED') {
          setError('Backend server is not running. Run "./start-app.sh" to start it.');
        } else if (healthErr.code === 'ECONNABORTED' || healthErr.message.includes('timeout')) {
          setError('Backend server is not responding. Please check if it\'s running.');
        } else {
          setError('Cannot connect to backend server. Make sure it\'s running on port 5001.');
        }
        return false;
      }

      const res = await axios.post('http://localhost:5001/api/auth/register', { name, email, password }, {
        timeout: 10000
      });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setUser(res.data.user);
      return true;
    } catch (err) {
      let message = 'Registration failed';
      
      if (err.response?.status === 503) {
        message = 'Database service is unavailable. Please ensure MongoDB is running and the backend is restarted.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        message = 'Request timeout - backend server is not responding.';
      } else if (err.code === 'ECONNREFUSED') {
        message = 'Cannot connect to backend. Please run "./start-app.sh"';
      }
      
      setError(message);
      console.error('Register error:', message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
