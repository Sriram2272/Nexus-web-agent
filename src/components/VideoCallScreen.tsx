import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Circle, 
  MessageSquare, 
  Brain,
  FileText,
  Send
} from 'lucide-react';
import { type CallConfig } from './CreateCallModal';
import { generatePersonaResponse } from '@/data/personas';
import { useToast } from '@/hooks/use-toast';

// Add type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

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

interface VideoCallScreenProps {
  config: CallConfig;
  onEndCall: (recording: Recording) => void;
}

export function VideoCallScreen({ config, onEndCall }: VideoCallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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

  // Initialize speech recognition
  useEffect(() => {
    if (config.enableMic && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          handleUserMessage(result[0].transcript);
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Speech recognition error",
          description: "Falling back to text input",
          variant: "destructive"
        });
      };
    }

    // Initial AI greeting
    setTimeout(() => {
      const greeting = generatePersonaResponse(config.persona, 'hello');
      addTranscriptEntry('ai', greeting);
      speakText(greeting);
    }, 1000);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [config]);

  const addTranscriptEntry = (speaker: 'user' | 'ai', text: string) => {
    const entry: TranscriptEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now() - startTime,
      speaker,
      text
    };
    setTranscript(prev => [...prev, entry]);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      
      if (config.voice !== 'default' && voices.length > 0) {
        const selectedVoice = voices.find(v => v.name === config.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleUserMessage = (message: string) => {
    if (!message.trim()) return;

    addTranscriptEntry('user', message);
    setUserInput('');
    
    // Simulate AI thinking
    setAiThinking(true);
    setTimeout(() => {
      const response = generatePersonaResponse(config.persona, message);
      addTranscriptEntry('ai', response);
      speakText(response);
      setAiThinking(false);
    }, 1500 + Math.random() * 1000);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech recognition not available",
        description: "Please use text input instead",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleEndCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
              <Badge variant="secondary" className="text-xs">Demo</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isRecording ? "default" : "secondary"} className="flex items-center gap-1">
            <Circle className={`w-2 h-2 ${isRecording ? 'animate-pulse fill-destructive text-destructive' : ''}`} />
            {isRecording ? 'Recording' : 'Not Recording'}
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
                className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 transition-all duration-300 ${
                  aiThinking ? 'animate-pulse scale-110' : ''
                }`}
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
              {aiThinking && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
                </div>
              )}
            </div>
          </div>

          {/* User Input Area */}
          <div className="p-4 border-t bg-card">
            <div className="max-w-2xl mx-auto">
              {config.enableMic && recognitionRef.current ? (
                <div className="flex gap-2">
                  <Button
                    variant={isListening ? "default" : "outline"}
                    size="sm"
                    onClick={toggleListening}
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    {isListening ? 'Listening...' : 'Speak'}
                  </Button>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Or type your message..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUserMessage(userInput)}
                    />
                    <Button size="sm" onClick={() => handleUserMessage(userInput)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUserMessage(userInput)}
                  />
                  <Button size="sm" onClick={() => handleUserMessage(userInput)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        {showTranscript && (
          <Card className="w-80 m-4 flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Live Transcript
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(false)}
              >
                ×
              </Button>
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
        )}
      </div>

      {/* Controls */}
      <div className="border-t bg-card p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            variant={isVideoOn ? "outline" : "destructive"}
            size="sm"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>

          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
          >
            <Circle className={`w-4 h-4 ${isRecording ? 'fill-current' : ''}`} />
            {isRecording ? 'Stop' : 'Record'}
          </Button>

          {!showTranscript && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranscript(true)}
            >
              <MessageSquare className="w-4 h-4" />
              Transcript
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={handleEndCall}
            className="ml-8"
          >
            <Phone className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
}