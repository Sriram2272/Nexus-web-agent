import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  FileText, 
  Calendar, 
  Clock, 
  Trash2,
  User,
  Bot
} from 'lucide-react';
import { VideoCallScreen } from './VideoCallScreen';
import { MeetingSummary } from './MeetingSummary';

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

interface RecordingListProps {
  onClose: () => void;
}

export function RecordingList({ onClose }: RecordingListProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);
  const [showingSummary, setShowingSummary] = useState<Recording | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = () => {
    const savedRecordings = JSON.parse(localStorage.getItem('nexus_demo_calls') || '[]');
    setRecordings(savedRecordings.sort((a: Recording, b: Recording) => b.createdAt - a.createdAt));
  };

  const deleteRecording = (id: string) => {
    const updatedRecordings = recordings.filter(r => r.id !== id);
    setRecordings(updatedRecordings);
    localStorage.setItem('nexus_demo_calls', JSON.stringify(updatedRecordings));
  };

  const playRecording = (recording: Recording) => {
    setPlayingRecording(recording);
    setPlaybackPosition(0);
    setIsPlaybackActive(true);

    // Simulate playback by speaking through the transcript with timing
    let currentIndex = 0;
    const playNextEntry = () => {
      if (currentIndex >= recording.transcript.length) {
        setIsPlaybackActive(false);
        return;
      }

      const entry = recording.transcript[currentIndex];
      setPlaybackPosition(entry.timestamp);

      if (entry.speaker === 'ai') {
        // Speak AI responses during playback
        const utterance = new SpeechSynthesisUtterance(entry.text);
        utterance.rate = 1.2; // Slightly faster for playback
        utterance.onend = () => {
          currentIndex++;
          setTimeout(playNextEntry, 500); // Small pause between entries
        };
        speechSynthesis.speak(utterance);
      } else {
        // Just display user messages
        currentIndex++;
        setTimeout(playNextEntry, 1000);
      }
    };

    playNextEntry();
  };

  const stopPlayback = () => {
    speechSynthesis.cancel();
    setIsPlaybackActive(false);
    setPlayingRecording(null);
    setPlaybackPosition(0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getParticipantCount = (transcript: TranscriptEntry[]) => {
    const speakers = new Set(transcript.map(t => t.speaker));
    return speakers.size;
  };

  const getLastMessage = (transcript: TranscriptEntry[]) => {
    const lastEntry = transcript[transcript.length - 1];
    if (!lastEntry) return 'No messages';
    return lastEntry.text.length > 60 
      ? lastEntry.text.substring(0, 60) + '...'
      : lastEntry.text;
  };

  // If viewing summary
  if (showingSummary) {
    return (
      <MeetingSummary 
        recording={showingSummary}
        onBack={() => setShowingSummary(null)}
      />
    );
  }

  // If playing recording
  if (playingRecording) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={stopPlayback}>
              ← Stop Playback
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              Playing Recording
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Position: {formatTime(playbackPosition)} / {formatTime(playingRecording.duration)}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div 
              className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 transition-all duration-300 ${
                isPlaybackActive ? 'animate-pulse scale-110' : ''
              }`}
              style={{ 
                backgroundColor: `${playingRecording.persona.color}20`, 
                color: playingRecording.persona.color,
                border: `3px solid ${playingRecording.persona.color}40`
              }}
            >
              {playingRecording.persona.avatar}
            </div>
            <h3 className="text-xl font-semibold">{playingRecording.persona.name}</h3>
            <p className="text-muted-foreground">{playingRecording.title}</p>
            
            <div className="mt-8 max-w-2xl">
              <div className="bg-card rounded-lg p-4">
                <h4 className="font-medium mb-3">Current Transcript</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto text-sm text-left">
                  {playingRecording.transcript
                    .filter(entry => entry.timestamp <= playbackPosition + 5000) // Show entries up to current position + buffer
                    .slice(-5) // Show last 5 entries
                    .map((entry) => (
                    <div key={entry.id} className={`flex gap-2 ${
                      entry.speaker === 'ai' ? 'text-primary' : 'text-foreground'
                    }`}>
                      {entry.speaker === 'ai' ? (
                        <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{entry.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Call Recordings</h1>
            <p className="text-sm text-muted-foreground">
              {recordings.length} recordings • Demo Mode
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            ← Back to Search
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {recordings.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
            <p className="text-muted-foreground mb-6">
              Start an AI video call to create your first recording.
            </p>
            <Button onClick={onClose}>Start Your First Call</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <Card key={recording.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                      style={{ 
                        backgroundColor: `${recording.persona.color}20`, 
                        color: recording.persona.color 
                      }}
                    >
                      {recording.persona.avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{recording.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recording.persona.name} • {recording.persona.title}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(recording.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(recording.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getParticipantCount(recording.transcript)} participants
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Last: {getLastMessage(recording.transcript)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playRecording(recording)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowingSummary(recording)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Summary
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecording(recording.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}