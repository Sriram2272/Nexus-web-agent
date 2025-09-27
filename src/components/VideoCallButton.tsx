import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Sparkles, FileText } from 'lucide-react';

interface VideoCallButtonProps {
  onClick: () => void;
  variant?: 'start' | 'recordings';
  className?: string;
}

export function VideoCallButton({ onClick, variant = 'start', className }: VideoCallButtonProps) {
  if (variant === 'recordings') {
    return (
      <Button
        onClick={onClick}
        variant="outline"
        className={`relative hover:shadow-lg transition-all duration-300 ${className}`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="font-medium">View Recordings</span>
        </div>
        
        {/* Demo badge */}
        <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
          Demo
        </div>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      className={`relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      size="lg"
    >
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4" />
        <span className="font-medium">Start AI Video Call</span>
        <Sparkles className="w-3 h-3 opacity-80" />
      </div>
      
      {/* Demo badge */}
      <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
        Demo
      </div>
    </Button>
  );
}