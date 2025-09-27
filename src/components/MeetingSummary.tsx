import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Brain, 
  Clock, 
  User, 
  Bot,
  Send,
  Sparkles
} from 'lucide-react';
import { generatePersonaResponse } from '@/data/personas';

interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'user' | 'ai';
  text: string;
}

interface Recording {
  id: string;
  title: string;
  persona: any;
  transcript: TranscriptEntry[];
  createdAt: number;
  duration: number;
}

interface SummaryPoint {
  category: string;
  text: string;
}

interface AskAIMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface MeetingSummaryProps {
  recording: Recording;
  onBack: () => void;
}

export function MeetingSummary({ recording, onBack }: MeetingSummaryProps) {
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [askAIMessages, setAskAIMessages] = useState<AskAIMessage[]>([]);
  const [askInput, setAskInput] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [recording]);

  const generateSummary = () => {
    setIsGeneratingSummary(true);
    
    // Simulate summary generation delay
    setTimeout(() => {
      const summaryPoints: SummaryPoint[] = [];
      const transcript = recording.transcript;
      
      // Extract key points from transcript
      const aiMessages = transcript.filter(t => t.speaker === 'ai');
      const userMessages = transcript.filter(t => t.speaker === 'user');
      
      // Key Topics Discussed
      const topics = new Set<string>();
      userMessages.forEach(msg => {
        if (msg.text.toLowerCase().includes('weight') || msg.text.toLowerCase().includes('diet')) {
          topics.add('Weight Management');
        }
        if (msg.text.toLowerCase().includes('exercise') || msg.text.toLowerCase().includes('workout')) {
          topics.add('Exercise & Fitness');
        }
        if (msg.text.toLowerCase().includes('stress') || msg.text.toLowerCase().includes('anxious')) {
          topics.add('Mental Health');
        }
        if (msg.text.toLowerCase().includes('nutrition') || msg.text.toLowerCase().includes('food')) {
          topics.add('Nutrition');
        }
        if (msg.text.toLowerCase().includes('business') || msg.text.toLowerCase().includes('startup')) {
          topics.add('Business Strategy');
        }
        if (msg.text.toLowerCase().includes('skin') || msg.text.toLowerCase().includes('routine')) {
          topics.add('Skincare');
        }
      });

      if (topics.size === 0) {
        topics.add('General Discussion');
      }

      topics.forEach(topic => {
        summaryPoints.push({
          category: 'Key Topics',
          text: topic
        });
      });

      // AI Recommendations
      const recommendations = aiMessages
        .filter(msg => msg.text.includes('suggest') || msg.text.includes('recommend') || msg.text.includes('try'))
        .slice(0, 3);
      
      recommendations.forEach((rec, index) => {
        const shortRec = rec.text.split('.')[0] + '.';
        summaryPoints.push({
          category: 'Recommendations',
          text: shortRec
        });
      });

      // Action Items (extract from AI responses)
      const actionWords = ['start', 'focus', 'try', 'consider', 'practice'];
      const actions = aiMessages
        .filter(msg => actionWords.some(word => msg.text.toLowerCase().includes(word)))
        .slice(0, 2);

      actions.forEach(action => {
        const actionText = action.text.split('.')[0] + '.';
        summaryPoints.push({
          category: 'Action Items',
          text: actionText
        });
      });

      // Duration and participants
      summaryPoints.push({
        category: 'Session Info',
        text: `${Math.floor(recording.duration / 60000)}:${Math.floor((recording.duration % 60000) / 1000).toString().padStart(2, '0')} session with ${recording.persona.name} (${recording.persona.title})`
      });

      setSummary(summaryPoints);
      setIsGeneratingSummary(false);
    }, 2000);
  };

  const handleAskAI = () => {
    if (!askInput.trim()) return;

    const userMessage: AskAIMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      text: askInput.trim(),
      timestamp: Date.now()
    };

    setAskAIMessages(prev => [...prev, userMessage]);
    setAskInput('');

    // Simulate AI thinking and response
    setTimeout(() => {
      // Search transcript for relevant context
      const query = askInput.toLowerCase();
      const relevantEntries = recording.transcript.filter(entry => 
        entry.text.toLowerCase().includes(query) ||
        query.split(' ').some(word => entry.text.toLowerCase().includes(word))
      );

      let response = '';
      
      if (relevantEntries.length > 0) {
        response = `Based on our conversation, ${generatePersonaResponse(recording.persona, askInput)} Here's what we discussed: "${relevantEntries[0].text.substring(0, 100)}..."`;
      } else {
        response = generatePersonaResponse(recording.persona, askInput);
      }

      const aiMessage: AskAIMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        text: response,
        timestamp: Date.now()
      };

      setAskAIMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const downloadTranscript = () => {
    const transcriptText = recording.transcript
      .map(entry => `[${formatTime(entry.timestamp)}] ${entry.speaker === 'ai' ? recording.persona.name : 'You'}: ${entry.text}`)
      .join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSummary = () => {
    const summaryText = `Meeting Summary: ${recording.title}\n\n` +
      summary.map(point => `${point.category}: ${point.text}`).join('\n\n');

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const groupedSummary = summary.reduce((acc, point) => {
    if (!acc[point.category]) acc[point.category] = [];
    acc[point.category].push(point.text);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${recording.persona.color}20`, color: recording.persona.color }}
            >
              {recording.persona.avatar}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{recording.title}</h1>
              <p className="text-sm text-muted-foreground">
                {recording.persona.name} • {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Summary
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meeting Summary
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadSummary} disabled={isGeneratingSummary}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {isGeneratingSummary ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Generating AI summary...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSummary).map(([category, points]) => (
                <div key={category}>
                  <h3 className="font-medium text-primary mb-2">{category}</h3>
                  <ul className="space-y-2">
                    {points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ask AI */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5" />
            Ask AI
          </h2>
          
          <ScrollArea className="flex-1 min-h-[300px] mb-4">
            <div className="space-y-3">
              {askAIMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ask questions about your meeting and I'll provide context-aware answers based on the conversation.
                </p>
              ) : (
                askAIMessages.map(message => (
                  <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        {message.type === 'user' ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Bot className="w-3 h-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.type === 'user' ? 'You' : recording.persona.name}
                        </span>
                      </div>
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Ask about the meeting..."
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
            />
            <Button size="sm" onClick={handleAskAI}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Transcript */}
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Full Transcript
            </h2>
            <Button variant="outline" size="sm" onClick={downloadTranscript}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {recording.transcript.map((entry, index) => (
                <div key={entry.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xs text-muted-foreground font-mono">
                        [{formatTime(entry.timestamp)}]
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      {entry.speaker === 'ai' ? (
                        <>
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">{recording.persona.name}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">You</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{entry.text}</p>
                    </div>
                  </div>
                  {index < recording.transcript.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}