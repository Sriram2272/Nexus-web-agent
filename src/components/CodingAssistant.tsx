import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Clock, 
  Zap, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { CodingResult, CodingApproach, ProblemLink } from '@/types';

interface CodingAssistantProps {
  results: CodingResult[];
  query: string;
  className?: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'text-success border-success/20 bg-success/10';
    case 'medium': return 'text-warning border-warning/20 bg-warning/10';
    case 'hard': return 'text-destructive border-destructive/20 bg-destructive/10';
    default: return 'text-muted-foreground border-border bg-muted/10';
  }
};

const getPlatformIcon = (platform: string) => {
  // You can add specific platform icons here
  return ExternalLink;
};

const CodeBlock: React.FC<{ 
  approach: CodingApproach;
  onCopy: () => void;
  copied: boolean;
}> = ({ approach, onCopy, copied }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{approach.name}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <CheckCircle className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
        <pre className="text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          <code>{approach.code}</code>
        </pre>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {approach.explanation}
        </p>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-accent" />
            <span>Time: <code className="text-primary">{approach.timeComplexity}</code></span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-secondary" />
            <span>Space: <code className="text-primary">{approach.spaceComplexity}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CodingAssistant: React.FC<CodingAssistantProps> = ({
  results,
  query,
  className = ""
}) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  if (!results || results.length === 0) {
    return (
      <Card className={`border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Coding Assistant
          </CardTitle>
          <CardDescription>
            No coding solutions found for "{query}"
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const result = results[0]; // For now, show the first result

  return (
    <div className={`space-y-6 ${className}`}>
      {results.map((result) => (
        <Card key={result.id} className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Code2 className="h-6 w-6 text-primary" />
                  {result.problem}
                </CardTitle>
                <CardDescription className="text-base">
                  Comprehensive coding solution with multiple approaches
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(result.difficulty)}>
                {result.difficulty}
              </Badge>
            </div>
            
            {/* Complexity Overview */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Best Time:</span>
                <code className="text-primary font-mono">{result.timeComplexity}</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Best Space:</span>
                <code className="text-primary font-mono">{result.spaceComplexity}</code>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {result.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Code Solutions */}
            <Tabs defaultValue="C" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="C">C</TabsTrigger>
                <TabsTrigger value="Python">Python</TabsTrigger>
                <TabsTrigger value="Java">Java</TabsTrigger>
              </TabsList>
              
              {['C', 'Python', 'Java'].map((language) => {
                const approaches = result.approaches.filter(a => a.language === language);
                
                return (
                  <TabsContent key={language} value={language} className="space-y-6 mt-6">
                    {approaches.length > 0 ? (
                      approaches.map((approach, index) => {
                        const copyKey = `${result.id}-${language}-${index}`;
                        return (
                          <Card key={index} className="bg-muted/5 border-border/50">
                            <CardContent className="p-6">
                              <CodeBlock
                                approach={approach}
                                onCopy={() => handleCopy(approach.code, copyKey)}
                                copied={copiedStates[copyKey] || false}
                              />
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No {language} solution available</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
            
            {/* Related Problems */}
            {result.relatedLinks.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Practice Problems
                  </CardTitle>
                  <CardDescription>
                    Similar problems to strengthen your understanding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {result.relatedLinks.map((link, index) => {
                      const PlatformIcon = getPlatformIcon(link.platform);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <PlatformIcon className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium text-sm">{link.title}</div>
                              <div className="text-xs text-muted-foreground">{link.platform}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getDifficultyColor(link.difficulty)}`}
                            >
                              {link.difficulty}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};