import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/RobustAuthContext';
import { getStudents, getVideos, deleteStudentAccount, resetStudentProgress } from '@/utils/storage';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Eye, Download, Settings, Trash2, RotateCcw } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const totalVideos = getVideos().length;
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    } else {
      loadStudents();
    }
  }, [user, navigate]);

  const loadStudents = () => {
    const allStudents = getStudents().filter(s => s.role === 'student');
    setStudents(allStudents);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewDetails = (username: string) => {
    navigate(`/admin/student/${username}`);
  };

  const handleContentManagement = () => {
    navigate('/admin/content');
  };

  const handleDeleteStudent = (student: Student) => {
    deleteStudentAccount(student.username);
    loadStudents();
    toast({
      title: 'Success',
      description: `Student account "${student.name}" has been deleted`,
    });
  };

  const handleResetProgress = (student: Student) => {
    resetStudentProgress(student.username);
    loadStudents();
    toast({
      title: 'Success',
      description: `Progress reset for "${student.name}"`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Username', 'Completed Videos', 'Total Videos', 'Progress (%)'];
    const rows = students.map(s => [
      s.name,
      s.username,
      s.completedVideos.length,
      totalVideos,
      ((s.completedVideos.length / totalVideos) * 100).toFixed(1),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-progress-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const averageProgress = students.length > 0
    ? students.reduce((sum, s) => sum + (s.completedVideos.length / totalVideos) * 100, 0) / students.length
    : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleContentManagement}>
                <Settings className="h-4 w-4 mr-2" />
                Content Management
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{averageProgress.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalVideos}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Progress</CardTitle>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const progress = (student.completedVideos.length / totalVideos) * 100;
                  return (
                    <TableRow key={student.username}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.username}</Badge>
                      </TableCell>
                      <TableCell>
                        {student.completedVideos.length} / {totalVideos}
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <ProgressBar value={progress} showLabel={false} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(student.username)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="Reset Progress">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset Student Progress</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reset the progress for "{student.name}"? 
                                  This will clear all {student.completedVideos.length} completed videos 
                                  and set their progress back to 0%. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResetProgress(student)}
                                  className="bg-orange-600 text-white hover:bg-orange-700"
                                >
                                  Reset Progress
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="Delete Account">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete the account for "{student.name}" ({student.username})? 
                                  This will remove their account and all progress data. This action cannot be undone.
                                  {student.completedVideos.length > 0 && (
                                    <span className="block mt-2 text-destructive font-medium">
                                      Warning: This student has completed {student.completedVideos.length} videos.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStudent(student)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
