import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({ value, className, showLabel = true }: ProgressBarProps) => {
  const getColorClass = () => {
    if (value >= 75) return 'bg-secondary';
    if (value >= 50) return 'bg-primary';
    if (value >= 25) return 'bg-warning';
    return 'bg-muted-foreground';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Progress value={value} className="h-2" indicatorClassName={getColorClass()} />
      {showLabel && (
        <p className="text-sm text-muted-foreground text-right">
          {value.toFixed(1)}% Complete
        </p>
      )}
    </div>
  );
};
