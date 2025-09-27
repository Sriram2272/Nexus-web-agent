import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Circle, 
  FileText,
  Play,
  Pause
} from 'lucide-react';
import { type CallConfig } from './CreateCallModal';
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
  persona: CallConfig['persona'];
  transcript: TranscriptEntry[];
  createdAt: number;
  duration: number;
}

interface AutoDemoVideoCallProps {
  config: CallConfig;
  onEndCall: (recording: Recording) => void;
}

export function AutoDemoVideoCall({ config, onEndCall }: AutoDemoVideoCallProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Demo conversation script - Fast 20-second version (4 conversations, ~5 seconds each)
  const getDemoScriptForField = (fieldId: string) => {
    const baseScripts: Record<string, any> = {
      'healthcare': [
        {
          user: "I have a headache and feel tired. What should I do?",
          ai: "That could be dehydration or stress. Try drinking water, rest, and see a doctor if it persists."
        },
        {
          user: "Should I be worried about these symptoms?",
          ai: "Monitor them closely. If they worsen or you get fever, definitely consult a healthcare provider."
        },
        {
          user: "Any immediate remedies I can try?",
          ai: "Rest in a quiet, dark room, stay hydrated, and consider a gentle neck massage."
        },
        {
          user: "Thank you for the advice!",
          ai: "You're welcome! Remember, always consult a doctor for persistent health concerns."
        }
      ],
      'fitness': [
        {
          user: "I want to start working out but I'm a complete beginner.",
          ai: "Great decision! Start with 20-30 minutes, 3 times per week. Focus on bodyweight exercises first."
        },
        {
          user: "What exercises should I begin with?",
          ai: "Try squats, push-ups (modified if needed), planks, and walking. Build consistency before intensity."
        },
        {
          user: "How do I stay motivated?",
          ai: "Set small, achievable goals. Track your progress and celebrate every workout completed!"
        },
        {
          user: "Thanks for the encouragement!",
          ai: "You've got this! Remember, the hardest part is just starting. Every step counts!"
        }
      ],
      'diet': [
        {
          user: "I want to eat healthier but don't know where to start.",
          ai: "Start simple! Fill half your plate with vegetables, add lean protein, and choose whole grains."
        },
        {
          user: "Any tips for meal planning?",
          ai: "Plan 3-4 go-to meals, prep on weekends, and keep healthy snacks ready. Start small!"
        },
        {
          user: "What about budget-friendly healthy eating?",
          ai: "Focus on beans, eggs, seasonal vegetables, and frozen fruits. Buy in bulk when possible."
        },
        {
          user: "This seems manageable, thank you!",
          ai: "Absolutely! Small changes lead to big results. You're already on the right track!"
        }
      ],
      'education': [
        {
          user: "I struggle to retain information when studying. Any tips?",
          ai: "Try active learning! Explain concepts out loud, use flashcards, and take regular breaks."
        },
        {
          user: "How should I structure my study sessions?",
          ai: "Use the Pomodoro technique: 25 minutes focused study, then 5-minute breaks. Very effective!"
        },
        {
          user: "I get distracted easily while studying.",
          ai: "Create a dedicated study space, put your phone away, and use website blockers if needed."
        },
        {
          user: "These are really practical suggestions!",
          ai: "Consistency is key! Start with just one technique and build from there. You can do this!"
        }
      ]
    };

    // Return script for field or default healthcare script
    return baseScripts[fieldId] || baseScripts['healthcare'];
  };

  const demoScript = config.demoField 
    ? getDemoScriptForField(config.demoField.id)
    : getDemoScriptForField('healthcare');

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Auto-play demo conversation
  useEffect(() => {
    if (isPlaying) {
      const playNextStep = () => {
        if (currentStep >= demoScript.length) {
          // Demo finished, end call
          setTimeout(() => {
            handleEndCall();
          }, 2000);
          return;
        }

        const step = demoScript[currentStep];
        const stepStartTime = Date.now();

        // Add user message
        const userEntry: TranscriptEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now() - startTime,
          speaker: 'user',
          text: step.user
        };
        setTranscript(prev => [...prev, userEntry]);

        // After 1 second, add AI response
        setTimeout(() => {
          const aiEntry: TranscriptEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now() - startTime,
            speaker: 'ai',
            text: step.ai
          };
          setTranscript(prev => [...prev, aiEntry]);

          // Speak the AI response
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(step.ai);
            utterance.rate = 1.5; // Faster speech for 20-second demo
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
          }

          // Move to next step after 4 seconds (total ~5 seconds per conversation)
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
          }, 4000);
        }, 1000);
      };

      // Start the conversation
      setTimeout(playNextStep, 1000);
    }
  }, [currentStep, isPlaying, startTime]);

  // Auto-start the demo
  useEffect(() => {
    const autoStart = setTimeout(() => {
      setIsPlaying(true);
    }, 1000); // Start faster

    return () => clearTimeout(autoStart);
  }, []);

  const addTranscriptEntry = (speaker: 'user' | 'ai', text: string) => {
    const entry: TranscriptEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now() - startTime,
      speaker,
      text
    };
    setTranscript(prev => [...prev, entry]);
  };

  const handleEndCall = () => {
    speechSynthesis.cancel();

    const recording: Recording = {
      id: Math.random().toString(36).substr(2, 9),
      title: config.title,
      persona: config.persona,
      transcript,
      createdAt: startTime,
      duration: elapsedTime
    };

    // Save to localStorage
    const existingRecordings = JSON.parse(localStorage.getItem('nexus_demo_calls') || '[]');
    existingRecordings.push(recording);
    localStorage.setItem('nexus_demo_calls', JSON.stringify(existingRecordings));

    onEndCall(recording);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTranscriptTime = (timestamp: number) => {
    return formatTime(timestamp);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${config.persona.color}20`, color: config.persona.color }}
          >
            {config.persona.avatar}
          </div>
          <div>
            <h2 className="font-semibold">{config.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{config.persona.name} • {config.persona.title}</span>
              <Badge variant="secondary" className="text-xs">Auto Demo</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="default" className="flex items-center gap-1">
            <Circle className="w-2 h-2 animate-pulse fill-destructive text-destructive" />
            Demo Running
          </Badge>
          <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-muted/20">
          <div className="flex-1 flex items-center justify-center p-8">
            {/* AI Avatar */}
            <div className="text-center">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 transition-all duration-300 animate-pulse scale-110"
                style={{ 
                  backgroundColor: `${config.persona.color}20`, 
                  color: config.persona.color,
                  border: `3px solid ${config.persona.color}40`
                }}
              >
                {config.persona.avatar}
              </div>
              <h3 className="text-xl font-semibold">{config.persona.name}</h3>
              <p className="text-muted-foreground">{config.persona.title}</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {isPlaying ? 'Running Demo Conversation...' : 'Demo Starting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 border-t bg-card">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Demo Progress</span>
                <span>{currentStep} / {demoScript.length} conversations</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / demoScript.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        <Card className="w-80 m-4 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Live Demo Transcript
            </h3>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {transcript.map((entry) => (
                <div key={entry.id} className={`text-sm ${
                  entry.speaker === 'ai' ? 'text-primary' : 'text-foreground'
                }`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    [{formatTranscriptTime(entry.timestamp)}] {entry.speaker === 'ai' ? config.persona.name : 'You'}:
                  </div>
                  <div className="pl-2 border-l-2 border-border">
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Controls */}
      <div className="border-t bg-card p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
          <Button
            variant={isPlaying ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause Demo' : 'Resume Demo'}
          </Button>

          <Button
            variant="destructive"
            onClick={handleEndCall}
          >
            <Phone className="w-4 h-4 mr-2" />
            End Demo & View Summary
          </Button>
        </div>
      </div>
    </div>
  );
}