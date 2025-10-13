import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/RobustAuthContext';
import { getStudent, getVideos } from '@/utils/storage';
import { Student } from '@/types';
import { VideoChecklist } from '@/components/VideoChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const AdminStudentView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const videos = getVideos();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (username) {
      const foundStudent = getStudent(username);
      if (foundStudent) {
        setStudent(foundStudent);
      } else {
        navigate('/admin');
      }
    }
  }, [user, username, navigate]);

  if (!student) return null;

  const totalVideos = videos.length;
  const completedCount = student.completedVideos.length;
  const progressPercentage = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {student.name}
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
              Last updated: {format(new Date(student.lastUpdated), 'PPp')}
            </div>
          </CardContent>
        </Card>

        <VideoChecklist
          videos={videos}
          completedVideos={student.completedVideos}
          readOnly={true}
        />
      </main>
    </div>
  );
};

export default AdminStudentView;
