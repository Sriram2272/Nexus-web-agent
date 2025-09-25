import { useState, useEffect } from "react";
import { mockDemoSteps } from "@/lib/mockData";
import { DemoStep } from "@/types";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const DemoMode = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = mockDemoSteps;
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next step
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            return 0;
          } else {
            // Demo completed
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + (100 / (currentStepData.duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, currentStepData.duration, steps.length]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
  };

  const handleStepChange = (direction: 'prev' | 'next') => {
    setIsPlaying(false);
    setProgress(0);
    
    if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (direction === 'next' && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <Card className="overflow-hidden neural-border">
      <div className="p-6">
        {/* Demo Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center neural-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gradient-neural">AI Demo Mode</h3>
              <p className="text-sm text-muted-foreground">
                Watch WebNavigatorAI search across multiple sites
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleStepChange('prev')}
              disabled={currentStep === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              onClick={handlePlay}
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              className="min-w-[80px]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={() => handleStepChange('next')}
              disabled={currentStep === steps.length - 1}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Demo Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Screenshot */}
          <div className="relative group">
            <div className="aspect-video bg-muted/20 rounded-lg overflow-hidden">
              <img
                src={currentStepData.screenshot}
                alt={currentStepData.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Highlight Overlay */}
              {currentStepData.highlight && (
                <div
                  className="absolute border-2 border-accent bg-accent/10 rounded animate-pulse"
                  style={{
                    left: `${(currentStepData.highlight.x / 800) * 100}%`,
                    top: `${(currentStepData.highlight.y / 450) * 100}%`,
                    width: `${(currentStepData.highlight.width / 800) * 100}%`,
                    height: `${(currentStepData.highlight.height / 450) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                    Focus Area
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gradient-primary">
                {currentStepData.title}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex flex-wrap gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentStep(index);
                    setProgress(0);
                    setIsPlaying(false);
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-primary text-primary-foreground shadow-neural'
                      : index < currentStep
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Technical Details */}
            <div className="p-4 rounded-lg bg-muted/20 border border-border">
              <h5 className="font-medium mb-2 text-sm">Technical Implementation</h5>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Playwright browser automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>AI-powered element detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span>Real-time screenshot capture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span>Local LLM processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-play Notice */}
        {isPlaying && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-accent">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span>Demo playing automatically...</span>
          </div>
        )}
      </div>
    </Card>
  );
};