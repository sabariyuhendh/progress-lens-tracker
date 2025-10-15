import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { simpleApi } from '@/utils/simpleApi';
import { VideoChecklist } from '@/components/VideoChecklist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { LogOut, User, Calendar, Users, Video, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const SimpleAdminView = () => {
  const { user, logout, updateProgress } = useUser();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        console.log('🔄 Loading admin data for user:', user.username);
        const [videosResponse, usersResponse] = await Promise.all([
          simpleApi.getVideos(),
          simpleApi.getUsers()
        ]);
        
        // Extract arrays from API responses
        const videosData = videosResponse.videos || videosResponse || [];
        const usersData = usersResponse.users || usersResponse || [];
        
        console.log('✅ Admin data loaded successfully:', { videos: videosData.length, users: usersData.length });
        setVideos(Array.isArray(videosData) ? videosData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('❌ Failed to load admin data:', error);
        setVideos([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleToggleVideo = async (videoId: string) => {
    if (!user || !Array.isArray(videos)) return;
    
    try {
      const currentVideo = videos.find(v => v.id.toString() === videoId);
      if (!currentVideo) return;
      
      const isCompleted = user.completedVideos?.includes(videoId) || false;
      const success = await updateProgress(videoId, !isCompleted);
      
      if (success) {
        console.log(`✅ Video ${videoId} marked as ${!isCompleted ? 'completed' : 'incomplete'}`);
      }
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Group videos by folder - with safe array handling
  const videosByFolder = Array.isArray(videos) ? videos.reduce((acc, video) => {
    if (video && video.folder) {
      if (!acc[video.folder]) {
        acc[video.folder] = [];
      }
      acc[video.folder].push(video);
    }
    return acc;
  }, {} as Record<string, any[]>) : {};

  // Calculate overall progress - with safe array handling
  const totalVideos = Array.isArray(videos) ? videos.length : 0;
  const completedVideos = Array.isArray(user.completedVideos) ? user.completedVideos.length : 0;
  const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVideos}</div>
              <p className="text-xs text-muted-foreground">Across {Object.keys(videosByFolder).length} folders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercentage}%</div>
              <p className="text-xs text-muted-foreground">{completedVideos}/{totalVideos} videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Folders</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(videosByFolder).length}</div>
              <p className="text-xs text-muted-foreground">Learning categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
              <CardDescription>Track your own progress through the content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                </div>
                <ProgressBar progress={progressPercentage} />
                
                {Object.entries(videosByFolder).map(([folder, folderVideos]) => {
                  const safeFolderVideos = Array.isArray(folderVideos) ? folderVideos : [];
                  const safeCompletedVideos = Array.isArray(user.completedVideos) ? user.completedVideos : [];
                  const folderCompleted = safeFolderVideos.filter(video => 
                    video && video.id && safeCompletedVideos.includes(video.id.toString())
                  ).length;
                  const folderProgress = safeFolderVideos.length > 0 ? Math.round((folderCompleted / safeFolderVideos.length) * 100) : 0;
                  
                  return (
                    <div key={folder} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{folder}</span>
                        <span className="text-sm text-muted-foreground">{folderProgress}%</span>
                      </div>
                      <ProgressBar progress={folderProgress} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Overview of all users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(users) ? users.map((userData) => (
                  <div key={userData?.id || Math.random()} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {userData?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{userData?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">@{userData?.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{userData?.role || 'unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {userData?.completed_videos || 0}/{userData?.total_videos || 0} videos
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Learning Content</CardTitle>
            <CardDescription>All available videos organized by folder</CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(videos) && videos.length > 0 ? (
              <VideoChecklist 
                videos={videos}
                completedVideos={Array.isArray(user.completedVideos) ? user.completedVideos : []}
                onToggleVideo={handleToggleVideo}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">No videos available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleAdminView;
