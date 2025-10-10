import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVideos, updateStudent } from '@/utils/storage';
import { VideoChecklist } from '@/components/VideoChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { LogOut, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const StudentView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState(getVideos());
  const [completedVideos, setCompletedVideos] = useState<string[]>(user?.completedVideos || []);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleToggleVideo = (videoId: string) => {
    const newCompleted = completedVideos.includes(videoId)
      ? completedVideos.filter(id => id !== videoId)
      : [...completedVideos, videoId];
    
    setCompletedVideos(newCompleted);
    if (user) {
      updateStudent(user.username, { completedVideos: newCompleted });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalVideos = videos.length;
  const completedCount = completedVideos.length;
  const progressPercentage = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Learning Progress</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {user.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-sm font-semibold">
                  {completedCount} / {totalVideos} videos
                </p>
              </div>
              <ProgressBar value={progressPercentage} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: {format(new Date(user.lastUpdated), 'PPp')}
            </div>
          </CardContent>
        </Card>

        <VideoChecklist
          videos={videos}
          completedVideos={completedVideos}
          onToggleVideo={handleToggleVideo}
        />
      </main>
    </div>
  );
};

export default StudentView;
