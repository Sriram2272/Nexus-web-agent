import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Mic, Clock } from 'lucide-react';
import { personas, type Persona } from '@/data/personas';

interface CreateCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (config: CallConfig) => void;
}

export interface CallConfig {
  persona: Persona;
  title: string;
  duration: number;
  voice: string;
  enableMic: boolean;
  demoField?: any; // Optional field for demo calls
}

export function CreateCallModal({ isOpen, onClose, onStartCall }: CreateCallModalProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(personas[0]);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [voice, setVoice] = useState('default');
  const [enableMic, setEnableMic] = useState(true);

  // Get available voices from browser
  const voices = speechSynthesis.getVoices();
  const availableVoices = voices.length > 0 ? voices : [{ name: 'Default', lang: 'en-US' }];

  const handleStart = () => {
    if (!title.trim()) {
      return;
    }

    onStartCall({
      persona: selectedPersona,
      title: title.trim(),
      duration,
      voice,
      enableMic
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Create New AI Video Call
            <Badge variant="secondary" className="ml-auto">Demo Mode</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Persona Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose AI Persona</Label>
            <div className="grid grid-cols-2 gap-3">
              {personas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedPersona.id === persona.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelectedPersona(persona)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${persona.color}20`, color: persona.color }}
                    >
                      {persona.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{persona.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{persona.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Meeting Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Health Check-in"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration (minutes)
              </Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice">AI Voice</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Voice</SelectItem>
                  {availableVoices.slice(0, 5).map((v, index) => (
                    <SelectItem key={index} value={v.name}>
                      {v.name} ({v.lang || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <div>
                  <Label className="font-medium">Enable Microphone Input</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use speech recognition (fallback to typing if unavailable)
                  </p>
                </div>
              </div>
              <Switch checked={enableMic} onCheckedChange={setEnableMic} />
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-accent/20 border border-accent rounded-lg p-3">
            <p className="text-sm text-accent-foreground">
              <strong>Demo Notice:</strong> This is a frontend-only simulation. AI responses are pre-programmed, 
              no real LLMs or servers are used. All data is stored locally in your browser.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleStart} 
              disabled={!title.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              Start Call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}