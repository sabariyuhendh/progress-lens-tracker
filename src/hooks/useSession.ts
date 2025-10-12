import { useState, useEffect, useCallback } from 'react';
import { sessionManager, SessionData } from '@/utils/sessionManager';

export const useSession = () => {
  const [session, setSession] = useState<SessionData | null>(sessionManager.getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set initial loading state
    setLoading(false);

    // Add listener for session changes
    const handleSessionChange = (newSession: SessionData | null) => {
      setSession(newSession);
      setLoading(false);
    };

    sessionManager.addListener(handleSessionChange);

    return () => {
      sessionManager.removeListener(handleSessionChange);
    };
  }, []);

  const updateCompletedVideos = useCallback(async (completedVideos: string[]) => {
    await sessionManager.updateCompletedVideos(completedVideos);
  }, []);

  const refreshSession = useCallback(async () => {
    return await sessionManager.refreshSession();
  }, []);

  const clearSession = useCallback(() => {
    sessionManager.clearSession();
  }, []);

  return {
    session,
    loading,
    isLoggedIn: sessionManager.isLoggedIn(),
    userId: sessionManager.getUserId(),
    userRole: sessionManager.getUserRole(),
    completedVideos: sessionManager.getCompletedVideos(),
    timeUntilExpiry: sessionManager.getTimeUntilExpiry(),
    timeUntilInactivity: sessionManager.getTimeUntilInactivity(),
    updateCompletedVideos,
    refreshSession,
    clearSession
  };
};