import { useState, useEffect } from 'react';
import { getAllStudents, deleteStudentAccount, resetStudentProgress, getVideos } from '@/utils/storage';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, Users, Eye } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

const StudentManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    const allStudents = getAllStudents();
    const studentAccounts = allStudents.filter(s => s.role === 'student');
    setStudents(studentAccounts);
    setTotalVideos(getVideos().length);
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

  const getProgressPercentage = (completedVideos: string[]) => {
    return totalVideos > 0 ? (completedVideos.length / totalVideos) * 100 : 0;
  };

  const getStudentCount = () => students.length;
  const getTotalCompletedVideos = () => students.reduce((sum, s) => sum + s.completedVideos.length, 0);
  const getAverageProgress = () => {
    if (students.length === 0) return 0;
    const totalProgress = students.reduce((sum, s) => sum + getProgressPercentage(s.completedVideos), 0);
    return totalProgress / students.length;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{getStudentCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{getAverageProgress().toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCompletedVideos()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Accounts Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Completed Videos</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const progress = getProgressPercentage(student.completedVideos);
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
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(student.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
          
          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No student accounts found.</p>
              <p className="text-sm">Students can sign up using the registration form.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManager;
