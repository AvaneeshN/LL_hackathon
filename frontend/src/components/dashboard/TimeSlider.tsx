import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';

interface TimeSliderProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export const TimeSlider = ({ value, onChange, max = 60 }: TimeSliderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    onChange(0);
  }, [onChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onChange(value >= max ? 0 : value + 1);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, value, max, onChange]);

  return (
    <div className="noc-panel rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary hover:bg-primary/20"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:bg-secondary"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            max={max}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="font-mono text-sm text-primary min-w-[80px] text-right">
          <span className="text-muted-foreground">T=</span>
          {value.toString().padStart(2, '0')}
          <span className="text-muted-foreground text-xs">s</span>
        </div>
      </div>

      <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
        <span>0s</span>
        <span>15s</span>
        <span>30s</span>
        <span>45s</span>
        <span>60s</span>
      </div>
    </div>
  );
};
