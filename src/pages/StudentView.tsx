import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { apiService } from '@/services/api';
import { VideoChecklist } from '@/components/VideoChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { SessionStatus } from '@/components/SessionStatus';
import { LogOut, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const StudentView = () => {
  const { user, logout } = useAuth();
  const { completedVideos, updateCompletedVideos } = useSession();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadVideos = async () => {
      if (!user) {
        console.log('⏳ Waiting for user authentication...');
        return;
      }
      
      try {
        console.log('🔄 Loading videos for user:', user.username);
        const videosData = await apiService.getVideos();
        console.log('✅ Videos loaded successfully:', videosData.length);
        setVideos(videosData);
      } catch (error) {
        console.error('❌ Failed to load videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [user]);

  const handleToggleVideo = async (videoId: string) => {
    const newCompleted = completedVideos.includes(videoId)
      ? completedVideos.filter(id => id !== videoId)
      : [...completedVideos, videoId];

    // Update session immediately for responsive UI
    await updateCompletedVideos(newCompleted);
    
    // Update backend
    try {
      await apiService.updateUserProgress(videoId, !completedVideos.includes(videoId));
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Revert on error
      await updateCompletedVideos(completedVideos);
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
            <div className="flex items-center gap-4">
              <SessionStatus />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <Card className="mb-6 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading your progress...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </main>
    </div>
  );
};

export default StudentView;
