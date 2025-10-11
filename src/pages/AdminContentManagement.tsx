import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings } from 'lucide-react';
import FolderManager from '@/components/admin/FolderManager';
import VideoManager from '@/components/admin/VideoManager';
import StudentManager from '@/components/admin/StudentManager';

const AdminContentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create and manage folders and videos for your course curriculum. 
                Students will see these organized by folders in their learning progress.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="folders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="folders" className="space-y-6">
            <FolderManager />
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-6">
            <VideoManager />
          </TabsContent>
          
          <TabsContent value="students" className="space-y-6">
            <StudentManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminContentManagement;
