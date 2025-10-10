import { useState } from 'react';
import { Video, FolderProgress } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { ProgressBar } from './ProgressBar';
import { CheckCircle2, Circle, FolderOpen } from 'lucide-react';

interface VideoChecklistProps {
  videos: Video[];
  completedVideos: string[];
  onToggleVideo?: (videoId: string) => void;
  readOnly?: boolean;
}

export const VideoChecklist = ({ videos, completedVideos, onToggleVideo, readOnly = false }: VideoChecklistProps) => {
  // Group videos by folder
  const folderGroups = videos.reduce((acc, video) => {
    if (!acc[video.folder]) {
      acc[video.folder] = [];
    }
    acc[video.folder].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  // Calculate progress per folder
  const folderProgress: FolderProgress[] = Object.entries(folderGroups).map(([folder, vids]) => {
    const completed = vids.filter(v => completedVideos.includes(v.id)).length;
    const total = vids.length;
    return {
      folder,
      total,
      completed,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  const [openFolders, setOpenFolders] = useState<string[]>([Object.keys(folderGroups)[0]]);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" value={openFolders} onValueChange={setOpenFolders} className="space-y-3">
        {folderProgress.map((progress) => (
          <AccordionItem key={progress.folder} value={progress.folder} className="border-none">
            <Card className="overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 w-full">
                  <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{progress.folder}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.completed} of {progress.total} videos completed
                    </p>
                  </div>
                  <div className="w-32 shrink-0">
                    <ProgressBar value={progress.percentage} showLabel={false} />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4 space-y-2">
                  {folderGroups[progress.folder].map((video) => {
                    const isCompleted = completedVideos.includes(video.id);
                    return (
                      <div
                        key={video.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
                        } ${isCompleted ? 'bg-secondary/10' : ''}`}
                        onClick={() => !readOnly && onToggleVideo?.(video.id)}
                      >
                        {readOnly ? (
                          isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )
                        ) : (
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onToggleVideo?.(video.id)}
                            className="shrink-0"
                          />
                        )}
                        <span
                          className={`text-sm ${
                            isCompleted ? 'text-secondary font-medium' : 'text-foreground'
                          }`}
                        >
                          {video.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
