import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Dumbbell, 
  Apple, 
  Target, 
  GraduationCap, 
  TrendingUp,
  DollarSign,
  Calendar,
  Newspaper,
  Cloud,
  Clock,
  MessageSquare
} from 'lucide-react';

export interface DemoField {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'health' | 'business' | 'daily';
}

interface FieldSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectField: (field: DemoField) => void;
}

export const demoFields: DemoField[] = [
  // Health & Wellness
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical advice, symptoms, treatments',
    icon: <Heart className="w-5 h-5" />,
    color: 'hsl(0, 84%, 60%)',
    category: 'health'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Workout plans, exercise routines',
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'hsl(142, 76%, 36%)',
    category: 'health'
  },
  {
    id: 'diet',
    name: 'Diet & Nutrition',
    description: 'Meal plans, nutrition advice',
    icon: <Apple className="w-5 h-5" />,
    color: 'hsl(120, 60%, 50%)',
    category: 'health'
  },
  {
    id: 'motivation',
    name: 'Motivation & Goals',
    description: 'Life coaching, goal setting',
    icon: <Target className="w-5 h-5" />,
    color: 'hsl(45, 100%, 51%)',
    category: 'health'
  },

  // Business & Education
  {
    id: 'education',
    name: 'Education',
    description: 'Learning, tutoring, study tips',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'hsl(210, 79%, 46%)',
    category: 'business'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Digital marketing, brand strategy',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'hsl(271, 81%, 56%)',
    category: 'business'
  },
  {
    id: 'stocks',
    name: 'Stocks & Finance',
    description: 'Investment advice, market analysis',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'hsl(142, 71%, 45%)',
    category: 'business'
  },

  // Daily Life
  {
    id: 'daily-planning',
    name: 'Daily Planning',
    description: 'Schedule, productivity, time management',
    icon: <Calendar className="w-5 h-5" />,
    color: 'hsl(200, 50%, 60%)',
    category: 'daily'
  },
  {
    id: 'news',
    name: 'Today\'s News',
    description: 'Current events, news summary',
    icon: <Newspaper className="w-5 h-5" />,
    color: 'hsl(25, 95%, 53%)',
    category: 'daily'
  },
  {
    id: 'weather',
    name: 'Weather & Travel',
    description: 'Weather updates, travel planning',
    icon: <Cloud className="w-5 h-5" />,
    color: 'hsl(200, 100%, 50%)',
    category: 'daily'
  },
  {
    id: 'general',
    name: 'General Chat',
    description: 'Casual conversation, Q&A',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'hsl(300, 76%, 72%)',
    category: 'daily'
  }
];

export function FieldSelectionModal({ isOpen, onClose, onSelectField }: FieldSelectionModalProps) {
  const [selectedField, setSelectedField] = useState<DemoField | null>(null);

  const handleStartDemo = () => {
    if (selectedField) {
      onSelectField(selectedField);
    }
  };

  const groupedFields = {
    health: demoFields.filter(f => f.category === 'health'),
    business: demoFields.filter(f => f.category === 'business'),
    daily: demoFields.filter(f => f.category === 'daily')
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Choose Demo Field
            <Badge variant="secondary" className="ml-auto">Start Live Call</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select a field to start a live demo call. Experience real conversations with AI assistance.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Health & Wellness */}
          <div className="space-y-3">
            <h3 className="font-medium text-primary flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Health & Wellness
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {groupedFields.health.map((field) => (
                <Card
                  key={field.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedField?.id === field.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${field.color}20`, color: field.color }}
                    >
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{field.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {field.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Business & Education */}
          <div className="space-y-3">
            <h3 className="font-medium text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Business & Education
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {groupedFields.business.map((field) => (
                <Card
                  key={field.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedField?.id === field.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${field.color}20`, color: field.color }}
                    >
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{field.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {field.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Daily Life */}
          <div className="space-y-3">
            <h3 className="font-medium text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Life & General
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {groupedFields.daily.map((field) => (
                <Card
                  key={field.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedField?.id === field.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${field.color}20`, color: field.color }}
                    >
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{field.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {field.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-accent/20 border border-accent rounded-lg p-3">
            <p className="text-sm text-accent-foreground">
              <strong>Live Demo Call:</strong> Experience a real conversation with our AI assistant. 
              The call will be saved automatically for you to review later.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleStartDemo} 
              disabled={!selectedField}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              Start Demo Call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}