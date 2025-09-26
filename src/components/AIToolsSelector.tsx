import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Search, 
  Brain, 
  BookOpen, 
  Code2,
  Sparkles
} from 'lucide-react';
import { AIToolMode, AIToolConfig } from '@/types';

interface AIToolsSelectorProps {
  selectedMode: AIToolMode;
  onModeChange: (mode: AIToolMode) => void;
  suggestedModes?: string[];
  className?: string;
}

const AI_TOOLS: Record<AIToolMode, AIToolConfig> = {
  quick: {
    mode: 'quick',
    name: 'Quick Answer',
    description: 'Concise 2-3 line responses',
    icon: 'Zap'
  },
  research: {
    mode: 'research',
    name: 'Deep Research',
    description: 'Detailed analysis with references',
    icon: 'Search'
  },
  learning: {
    mode: 'learning',
    name: 'Deep Learning',
    description: 'ML/AI focused explanations',
    icon: 'Brain'
  },
  study: {
    mode: 'study',
    name: 'Study Mode',
    description: 'Step-by-step tutoring',
    icon: 'BookOpen'
  },
  coding: {
    mode: 'coding',
    name: 'Coding Assistant',
    description: 'Code solutions & test cases',
    icon: 'Code2'
  }
};

const getIcon = (iconName: string) => {
  const icons = {
    Zap,
    Search,
    Brain,
    BookOpen,
    Code2
  };
  return icons[iconName as keyof typeof icons] || Zap;
};

export const AIToolsSelector: React.FC<AIToolsSelectorProps> = ({
  selectedMode,
  onModeChange,
  suggestedModes = [],
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">AI Tools</h3>
        {suggestedModes.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            Suggested for this query
          </Badge>
        )}
      </div>
      
      <ToggleGroup
        type="single"
        value={selectedMode}
        onValueChange={(value) => value && onModeChange(value as AIToolMode)}
        className="grid grid-cols-2 md:grid-cols-5 gap-2"
      >
        {Object.entries(AI_TOOLS).map(([mode, config]) => {
          const Icon = getIcon(config.icon);
          const isSelected = selectedMode === mode;
          const isSuggested = suggestedModes.includes(mode);
          
          return (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className={`
                relative flex flex-col items-center justify-center p-4 h-auto space-y-2
                border-2 rounded-xl transition-all duration-300
                hover:scale-105 hover:shadow-lg
                ${isSelected 
                  ? 'border-primary bg-primary/10 text-primary shadow-primary/25' 
                  : 'border-border bg-card hover:border-primary/50'
                }
                ${isSuggested && !isSelected ? 'ring-2 ring-accent/30 border-accent/50' : ''}
              `}
              aria-label={`${config.name}: ${config.description}`}
            >
              {isSuggested && !isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-accent rounded-full animate-pulse" />
                </div>
              )}
              
              <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              
              <div className="text-center">
                <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {config.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">
                  {config.description}
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10" />
              )}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      
      <div className="text-xs text-muted-foreground text-center">
        Choose how NexusAI should process and respond to your query
      </div>
    </div>
  );
};