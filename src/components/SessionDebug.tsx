import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut } from 'lucide-react';

export const SessionDebug: React.FC = () => {
  const { 
    session, 
    loading, 
    isLoggedIn, 
    timeUntilExpiry, 
    timeUntilInactivity,
    refreshSession,
    clearSession
  } = useSession();

  if (!isLoggedIn || !session) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm">Session Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active session</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Session Debug
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshSession}
              disabled={loading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearSession}
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">User:</span>
            <p className="text-muted-foreground">{session.name}</p>
          </div>
          <div>
            <span className="font-medium">Role:</span>
            <Badge variant="outline" className="ml-1">
              {session.role}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Session ID:</span>
            <p className="text-muted-foreground font-mono text-xs">
              {session.sessionId.substring(0, 12)}...
            </p>
          </div>
          <div>
            <span className="font-medium">Remember Me:</span>
            <Badge variant={session.rememberMe ? "default" : "secondary"} className="ml-1">
              {session.rememberMe ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Completed Videos:</span>
            <Badge variant="outline">{session.completedVideos.length}</Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span>Time Until Expiry:</span>
            <span className="text-muted-foreground">{formatTime(timeUntilExpiry)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Time Until Inactivity:</span>
            <span className="text-muted-foreground">{formatTime(timeUntilInactivity)}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Login: {new Date(session.loginTime).toLocaleTimeString()}</p>
          <p>Last Activity: {new Date(session.lastActivity).toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};
