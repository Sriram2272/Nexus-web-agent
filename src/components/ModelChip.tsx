import { useState, useEffect } from "react";
import { Bot, Plus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelPickerModal } from "@/components/ModelPickerModal";

interface ModelChipProps {
  selectedModel: string;
  isLocal: boolean;
  onModelChange: (model: string, isLocal: boolean) => void;
  disabled?: boolean;
}

export const ModelChip = ({ 
  selectedModel, 
  isLocal, 
  onModelChange, 
  disabled = false 
}: ModelChipProps) => {
  const [showPicker, setShowPicker] = useState(false);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        if (!disabled) {
          setShowPicker(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  const getModelShortName = (model: string) => {
    if (model.includes(':')) return model.split(':')[0];
    return model.length > 12 ? model.slice(0, 12) + '...' : model;
  };

  const getModelBehavior = (model: string) => {
    const modelName = model.toLowerCase();
    if (modelName.includes('smollm2')) return "Tiny & fast — quick replies, limited depth.";
    if (modelName.includes('llama2')) return "Generalist — balanced summarization & chat.";
    if (modelName.includes('llama3.2')) return "Instruction-tuned multilingual for dialogue & summaries.";
    if (modelName.includes('gemma3')) return "Efficient reasoning & instruction-following.";
    if (modelName.includes('qwen3')) return "Optimized language & code models.";
    if (modelName.includes('gpt-oss')) return "Open-source GPT-style generalist.";
    if (modelName.includes('deepsseek')) return "High-performance large-scale model.";
    if (modelName.includes('llava')) return "Vision+Language — image-aware queries/screenshots.";
    if (modelName.includes('granite')) return "Long-context reasoning (128K tokens) for big transcripts.";
    if (modelName.includes('bge-m3')) return "Fast embeddings for semantic search & transcript indexing.";
    if (modelName.includes('general-local')) return "General-purpose local model.";
    return "General-purpose model.";
  };

  const tooltipText = selectedModel ? 
    `Model: ${selectedModel} — ${getModelBehavior(selectedModel)}` : 
    "No model selected";

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(true)}
          disabled={disabled}
          className="h-8 px-2 rounded-lg bg-card/50 border border-border/50 hover:bg-muted/20 transition-all duration-200"
          title={tooltipText}
        >
          <div className="flex items-center gap-1.5">
            <Circle className={`w-2 h-2 fill-current ${
              isLocal ? 'text-success' : 
              selectedModel ? 'text-warning' : 'text-destructive'
            }`} />
            <Bot className="w-3 h-3" />
            <span className="text-xs font-medium">
              {isLocal ? 'Local: ON' : 'Local: OFF'}
            </span>
            <Plus className="w-3 h-3 opacity-60" />
          </div>
        </Button>
        
        {isLocal && (
          <Badge variant="outline" className="h-6 px-1.5 text-xs border-success/50 text-success">
            ON
          </Badge>
        )}
      </div>

      <ModelPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        selectedModel={selectedModel}
        onModelSelect={onModelChange}
      />
    </>
  );
};