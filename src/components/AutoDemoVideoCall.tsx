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

  // Demo conversation script - Simple English, slower pace
  const getDemoScriptForField = (fieldId: string) => {
    const baseScripts: Record<string, any> = {
      'healthcare': [
        {
          user: "Hi, I have a headache. What can I do?",
          ai: "Hello! Try drinking water and rest. If it gets worse, see a doctor."
        },
        {
          user: "Should I take medicine?",
          ai: "You can try basic pain medicine. But ask a doctor first if you're not sure."
        },
        {
          user: "When should I see a doctor?",
          ai: "See a doctor if the pain is very bad or lasts more than 2 days."
        },
        {
          user: "Thank you for helping me.",
          ai: "You're welcome! Take care of yourself and feel better soon!"
        }
      ],
      'fitness': [
        {
          user: "I want to start exercise. Where do I begin?",
          ai: "Great! Start with 15 minutes of walking every day. That's a good beginning."
        },
        {
          user: "What other exercises can I do?",
          ai: "Try simple things like push-ups, sit-ups, and stretching. Start slow."
        },
        {
          user: "How often should I exercise?",
          ai: "3 times a week is perfect for beginners. Don't do too much at first."
        },
        {
          user: "Thanks for the simple advice!",
          ai: "You're welcome! Remember, small steps every day make big changes!"
        }
      ],
      'diet': [
        {
          user: "I want to eat better food. How do I start?",
          ai: "Good choice! Start by eating more fruits and vegetables every day."
        },
        {
          user: "What should I avoid eating?",
          ai: "Try to eat less fast food and sugary drinks. Cook at home more."
        },
        {
          user: "Is it hard to eat healthy?",
          ai: "Not really! Make small changes. Replace chips with fruits for snacks."
        },
        {
          user: "That sounds easy to do!",
          ai: "Exactly! Small changes are the best way. You can do it!"
        }
      ],
      'education': [
        {
          user: "I have trouble studying. Can you help?",
          ai: "Of course! Try studying for 20 minutes, then take a 5-minute break."
        },
        {
          user: "I get distracted when I study.",
          ai: "Put your phone away and find a quiet place. That helps a lot."
        },
        {
          user: "How can I remember things better?",
          ai: "Write notes by hand and read them out loud. It helps your brain remember."
        },
        {
          user: "These tips are really helpful!",
          ai: "I'm glad to help! Practice these tips and you'll get better at studying!"
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

          // Speak the AI response slower
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(step.ai);
            utterance.rate = 0.8; // Slower speech for better understanding
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
            Live Demo Call
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
                  {isPlaying ? 'Having Demo Call...' : 'Demo Starting...'}
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
              End Call & View Summary
            </Button>
        </div>
      </div>
    </div>
  );
}