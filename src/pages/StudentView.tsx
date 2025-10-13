import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/RobustAuthContext';
import { apiService } from '@/services/api';
import { VideoChecklist } from '@/components/VideoChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { LogOut, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const StudentView = () => {
  const { user, logout, completedVideos, updateCompletedVideos } = useAuth();
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
      if (!user) return;
      
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
    const isCompleted = completedVideos.includes(videoId);
    const newCompleted = !isCompleted;

    try {
      console.log(`🔄 Updating video ${videoId} to ${newCompleted ? 'completed' : 'incomplete'}`);
      const success = await updateCompletedVideos(videoId, newCompleted);
      if (success) {
        console.log('✅ Video progress updated successfully');
      } else {
        console.error('❌ Failed to update video progress');
      }
    } catch (error) {
      console.error('❌ Error updating video progress:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const completedCount = completedVideos.length;
  const totalVideos = videos.length;
  const progressPercentage = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

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
          <>
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
                  Last updated: {format(new Date(), 'PPp')}
                </div>
              </CardContent>
            </Card>

            <VideoChecklist
              videos={videos}
              completedVideos={completedVideos}
              onToggleVideo={handleToggleVideo}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default StudentView;