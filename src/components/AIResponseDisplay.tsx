import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Clock, 
  ExternalLink, 
  Sparkles,
  BookOpen,
  Search,
  Lightbulb
} from 'lucide-react';
import { AIResponse, AIToolMode } from '@/types';

interface AIResponseDisplayProps {
  response: AIResponse;
  className?: string;
}

const getModeConfig = (mode: AIToolMode) => {
  const configs = {
    quick: {
      icon: Sparkles,
      name: 'Quick Answer',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    research: {
      icon: Search,
      name: 'Deep Research',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    learning: {
      icon: Brain,
      name: 'Deep Learning',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    study: {
      icon: BookOpen,
      name: 'Study Mode',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    coding: {
      icon: Lightbulb,
      name: 'Coding Assistant',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  };
  return configs[mode];
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-success border-success/20 bg-success/10';
  if (confidence >= 0.6) return 'text-warning border-warning/20 bg-warning/10';
  return 'text-destructive border-destructive/20 bg-destructive/10';
};

const formatContent = (content: string) => {
  // Simple formatting for better readability
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    // Handle headers (lines starting with #)
    if (line.startsWith('# ')) {
      return (
        <h3 key={index} className="text-lg font-semibold text-foreground mt-4 mb-2">
          {line.substring(2)}
        </h3>
      );
    }
    
    if (line.startsWith('## ')) {
      return (
        <h4 key={index} className="text-base font-medium text-foreground mt-3 mb-1">
          {line.substring(3)}
        </h4>
      );
    }
    
    // Handle bullet points
    if (line.trim().startsWith('- ')) {
      return (
        <li key={index} className="text-muted-foreground ml-4 mb-1">
          {line.substring(2)}
        </li>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = line.match(/^\d+\.\s/);
    if (numberedMatch) {
      return (
        <li key={index} className="text-muted-foreground ml-4 mb-1 list-decimal">
          {line.substring(numberedMatch[0].length)}
        </li>
      );
    }
    
    // Handle code blocks (simple backtick detection)
    if (line.includes('`')) {
      const parts = line.split('`');
      return (
        <p key={index} className="text-muted-foreground mb-2">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 1 ? (
              <code key={partIndex} className="bg-muted/20 px-1 rounded text-primary font-mono text-sm">
                {part}
              </code>
            ) : (
              part
            )
          )}
        </p>
      );
    }
    
    // Regular paragraph
    if (line.trim()) {
      return (
        <p key={index} className="text-muted-foreground mb-2 leading-relaxed">
          {line}
        </p>
      );
    }
    
    // Empty line for spacing
    return <div key={index} className="mb-2" />;
  });
};

export const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  response,
  className = ""
}) => {
  const modeConfig = getModeConfig(response.mode);
  const ModeIcon = modeConfig.icon;

  return (
    <Card className={`border-border/50 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <ModeIcon className={`h-5 w-5 ${modeConfig.color}`} />
              {modeConfig.name} Response
            </CardTitle>
            <CardDescription>
              AI analysis for: "{response.query}"
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getConfidenceColor(response.confidence)}>
              {Math.round(response.confidence * 100)}% confidence
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {response.processingTime.toFixed(1)}s
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`rounded-lg border p-4 ${modeConfig.bgColor} border-border/50`}>
          <div className="prose prose-sm max-w-none">
            {formatContent(response.content)}
          </div>
        </div>
        
        {/* References */}
        {response.references && response.references.length > 0 && (
          <Card className="bg-muted/5 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-accent" />
                References & Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {response.references.map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {ref}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() => window.open(ref, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};