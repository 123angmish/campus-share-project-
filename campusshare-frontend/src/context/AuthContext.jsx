/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, {
  getAccessToken,
  getStoredUser,
  refreshAccessToken,
  setAccessToken,
  setStoredUser
} from '../config/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    return !(token && stored);
  });

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const token = getAccessToken();
      const stored = getStoredUser();

      if (token && stored) {
        if (isMounted) {
          setUser(stored);
          setLoading(false);
        }

        // Silently verify user state in background
        try {
          const res = await api.get('/auth/me');
          if (isMounted) {
            setUser(res.data);
            setStoredUser(res.data, localStorage.getItem('campusshare_remember') === 'true');
          }
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            try {
              const session = await refreshAccessToken();
              if (isMounted && session.user) {
                setUser(session.user);
              }
            } catch {
              if (isMounted) {
                setAccessToken(null);
                setStoredUser(null);
                setUser(null);
              }
            }
          }
        }
      } else {
        // Try restoring session from HttpOnly refresh cookie if available
        try {
          const session = await refreshAccessToken();
          if (isMounted && session.user) {
            setUser(session.user);
          }
        } catch {
          if (isMounted) {
            setAccessToken(null);
            setStoredUser(null);
            setUser(null);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    initSession();

    const handleExpired = () => {
      setAccessToken(null);
      setStoredUser(null);
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('campusshare:session-expired', handleExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('campusshare:session-expired', handleExpired);
    };
  }, []);

  const login = async (email, password, rememberMe = true) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        rememberMe
      });
      const { accessToken, user: loggedInUser } = response.data;
      setAccessToken(accessToken, rememberMe);
      setStoredUser(loggedInUser, rememberMe);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).join(', ')
          : error.message || 'Invalid email or password.');
      return { success: false, error: message };
    }
  };

  const signup = async (data) => {
    try {
      const response = await api.post('/auth/signup', {
        ...data,
        email: data.email?.trim().toLowerCase()
      });
      if (response.data.requiresVerification) {
        return { success: true, requiresVerification: true, email: data.email };
      }
      const { accessToken, user: signedUpUser } = response.data;
      setAccessToken(accessToken, true);
      setStoredUser(signedUpUser, true);
      setUser(signedUpUser);
      return { success: true, user: signedUpUser };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).join(', ')
          : error.message || 'Could not create account. Please try again.');
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* local logout proceeds even if network call fails */
    }
    setAccessToken(null);
    setStoredUser(null);
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    const persistent = localStorage.getItem('campusshare_remember') === 'true';
    setStoredUser(nextUser, persistent);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN'
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
