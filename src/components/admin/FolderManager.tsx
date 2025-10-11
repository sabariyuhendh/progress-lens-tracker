import { useState, useEffect } from 'react';
import { getFolders, getVideosByFolder, getVideos } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';

const FolderManager = () => {
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    setFolders(getFolders());
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    if (folders.includes(newFolderName.trim())) {
      toast({
        title: 'Error',
        description: 'Folder already exists',
        variant: 'destructive',
      });
      return;
    }

    // Create a sample video to establish the folder
    const sampleVideo = {
      id: `${newFolderName.trim().toLowerCase().replace(/\s+/g, '-')}-1`,
      folder: newFolderName.trim(),
      title: 'Sample Video.mp4'
    };

    // Add the sample video to create the folder
    const videos = getVideos();
    videos.push(sampleVideo);
    localStorage.setItem('videoTracker_videos', JSON.stringify(videos));

    setNewFolderName('');
    loadFolders();
    toast({
      title: 'Success',
      description: 'Folder created successfully',
    });
  };

  const handleEditFolder = (oldFolderName: string) => {
    if (!editFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    if (folders.includes(editFolderName.trim()) && editFolderName.trim() !== oldFolderName) {
      toast({
        title: 'Error',
        description: 'Folder name already exists',
        variant: 'destructive',
      });
      return;
    }

    // Update all videos in this folder
    const videos = getVideos();
    const updatedVideos = videos.map(video => 
      video.folder === oldFolderName 
        ? { ...video, folder: editFolderName.trim() }
        : video
    );
    localStorage.setItem('videoTracker_videos', JSON.stringify(updatedVideos));

    setEditingFolder(null);
    setEditFolderName('');
    loadFolders();
    toast({
      title: 'Success',
      description: 'Folder updated successfully',
    });
  };

  const handleDeleteFolder = (folderName: string) => {
    // Delete all videos in this folder
    const videos = getVideos().filter(v => v.folder !== folderName);
    localStorage.setItem('videoTracker_videos', JSON.stringify(videos));

    // Remove from all students' completed videos
    const students = JSON.parse(localStorage.getItem('videoTracker_students') || '[]');
    const folderVideos = getVideosByFolder(folderName);
    const videoIds = folderVideos.map(v => v.id);
    
    students.forEach((student: any) => {
      const updatedCompletedVideos = student.completedVideos.filter((videoId: string) => !videoIds.includes(videoId));
      if (updatedCompletedVideos.length !== student.completedVideos.length) {
        student.completedVideos = updatedCompletedVideos;
        student.lastUpdated = new Date().toISOString();
      }
    });
    localStorage.setItem('videoTracker_students', JSON.stringify(students));

    loadFolders();
    toast({
      title: 'Success',
      description: 'Folder and all its videos deleted successfully',
    });
  };

  const getVideoCount = (folderName: string) => {
    return getVideosByFolder(folderName).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Create New Folder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="Enter folder name (e.g., '1.1 Python Basics')"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateFolder}>
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folder Name</TableHead>
                <TableHead>Video Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map((folder) => (
                <TableRow key={folder}>
                  <TableCell className="font-medium">
                    {editingFolder === folder ? (
                      <Input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditFolder(folder);
                          } else if (e.key === 'Escape') {
                            setEditingFolder(null);
                            setEditFolderName('');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      folder
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getVideoCount(folder)} videos</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {editingFolder === folder ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFolder(folder)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingFolder(null);
                              setEditFolderName('');
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingFolder(folder);
                              setEditFolderName(folder);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the folder "{folder}"? 
                                  This will also delete all {getVideoCount(folder)} videos in this folder 
                                  and remove them from all students' progress. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFolder(folder)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Folder
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderManager;
