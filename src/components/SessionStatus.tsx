import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, User } from 'lucide-react';

export const SessionStatus: React.FC = () => {
  const { 
    session, 
    timeUntilExpiry, 
    timeUntilInactivity, 
    isLoggedIn 
  } = useSession();

  if (!isLoggedIn || !session) {
    return null;
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getSessionStatus = () => {
    if (timeUntilInactivity < 5 * 60 * 1000) { // Less than 5 minutes
      return { color: 'destructive', text: 'Session expiring soon' };
    } else if (timeUntilInactivity < 15 * 60 * 1000) { // Less than 15 minutes
      return { color: 'secondary', text: 'Session active' };
    }
    return { color: 'default', text: 'Session active' };
  };

  const status = getSessionStatus();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <User className="h-3 w-3" />
      <span>{session.name}</span>
      
      <Badge variant={status.color as any} className="text-xs">
        <Shield className="h-2 w-2 mr-1" />
        {status.text}
      </Badge>
      
      {timeUntilInactivity < 15 * 60 * 1000 && (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-2 w-2 mr-1" />
          {formatTime(timeUntilInactivity)}
        </Badge>
      )}
    </div>
  );
};
