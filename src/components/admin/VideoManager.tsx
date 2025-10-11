import { useState, useEffect } from 'react';
import { getVideos, getFolders, addVideo, updateVideo, deleteVideo, getStudents } from '@/utils/storage';
import { Video, VideoFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Video as VideoIcon } from 'lucide-react';

const VideoManager = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<VideoFormData>({
    id: '',
    folder: '',
    title: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setVideos(getVideos());
    setFolders(getFolders());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id.trim() || !formData.folder.trim() || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if video ID already exists (unless editing)
    const existingVideo = videos.find(v => v.id === formData.id.trim());
    if (existingVideo && (!editingVideo || existingVideo.id !== editingVideo.id)) {
      toast({
        title: 'Error',
        description: 'Video ID already exists',
        variant: 'destructive',
      });
      return;
    }

    const videoData: Video = {
      id: formData.id.trim(),
      folder: formData.folder.trim(),
      title: formData.title.trim()
    };

    if (editingVideo) {
      updateVideo(editingVideo.id, videoData);
      toast({
        title: 'Success',
        description: 'Video updated successfully',
      });
    } else {
      addVideo(videoData);
      toast({
        title: 'Success',
        description: 'Video created successfully',
      });
    }

    resetForm();
    loadData();
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      id: video.id,
      folder: video.folder,
      title: video.title
    });
    setShowForm(true);
  };

  const handleDelete = (video: Video) => {
    // Check how many students have completed this video
    const students = getStudents();
    const completedByStudents = students.filter(student => 
      student.completedVideos.includes(video.id)
    );

    if (completedByStudents.length > 0) {
      toast({
        title: 'Warning',
        description: `This video has been completed by ${completedByStudents.length} student(s). Deleting will remove it from their progress.`,
        variant: 'destructive',
      });
    }

    deleteVideo(video.id);
    loadData();
    toast({
      title: 'Success',
      description: 'Video deleted successfully',
    });
  };

  const resetForm = () => {
    setFormData({ id: '', folder: '', title: '' });
    setShowForm(false);
    setEditingVideo(null);
  };

  const getCompletedCount = (videoId: string) => {
    const students = getStudents();
    return students.filter(student => student.completedVideos.includes(videoId)).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <VideoIcon className="h-5 w-5" />
              Video Management
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="videoId">Video ID</Label>
                  <Input
                    id="videoId"
                    placeholder="e.g., 1.1-1, custom-id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="folder">Folder</Label>
                  <Select value={formData.folder} onValueChange={(value) => setFormData({ ...formData, folder: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Python.mp4"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Videos ({videos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Completed By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-mono text-sm">{video.id}</TableCell>
                  <TableCell>{video.folder}</TableCell>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getCompletedCount(video.id)} students
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(video)}
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
                            <AlertDialogTitle>Delete Video</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{video.title}"? 
                              {getCompletedCount(video.id) > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                  Warning: This video has been completed by {getCompletedCount(video.id)} student(s). 
                                  Deleting will remove it from their progress.
                                </span>
                              )}
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(video)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Video
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default VideoManager;
