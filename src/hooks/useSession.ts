import { useEffect, useCallback } from 'react';

export const useSession = () => {
  const updateLastActivity = useCallback(() => {
    const sessionData = sessionStorage.getItem('user_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = Date.now();
      sessionStorage.setItem('user_session', JSON.stringify(session));
    }
  }, []);

  const checkSessionValidity = useCallback(() => {
    const sessionData = sessionStorage.getItem('user_session');
    if (!sessionData) return true;

    const session = JSON.parse(sessionData);
    const now = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Check if session has expired
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      // Clear expired session
      sessionStorage.removeItem('user_session');
      sessionStorage.removeItem('auth_token');
      return false;
    }

    return true;
  }, []);

  const getSessionInfo = useCallback(() => {
    const sessionData = sessionStorage.getItem('user_session');
    if (!sessionData) return null;

    return JSON.parse(sessionData);
  }, []);

  // Update activity on user interaction
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [updateLastActivity]);

  // Check session validity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!checkSessionValidity()) {
        // Session expired, redirect to login
        window.location.href = '/login';
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkSessionValidity]);

  return {
    updateLastActivity,
    checkSessionValidity,
    getSessionInfo
  };
};
