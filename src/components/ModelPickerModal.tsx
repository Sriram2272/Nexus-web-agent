import { useState, useEffect } from "react";
import { Search, Download, Check, Circle, Star, Zap, Clock, Database, Cloud, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ModelData {
  name: string;
  status: "local" | "downloadable" | "cloud";
  size?: string;
  latency_category: "Fast" | "Balanced" | "Large";
  description: string;
  downloading?: boolean;
  progress?: number;
}

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelSelect: (model: string, isLocal: boolean) => void;
}

export const ModelPickerModal = ({
  isOpen,
  onClose,
  selectedModel,
  onModelSelect
}: ModelPickerModalProps) => {
  const [models, setModels] = useState<ModelData[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [primaryModel, setPrimaryModel] = useState(selectedModel);
  const [fallbackModels, setFallbackModels] = useState<string[]>([]);
  const [pinnedModel, setPinnedModel] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const { toast } = useToast();

  // Mock model data - client-side only
  const mockModels: ModelData[] = [
    { name: "smollm2:135m", status: "local", size: "135MB", latency_category: "Fast", description: "Tiny & fast — quick replies, limited depth." },
    { name: "llama2:7b", status: "local", size: "3.8GB", latency_category: "Balanced", description: "Generalist — balanced summarization & chat (7B)." },
    { name: "llama2:13b", status: "downloadable", size: "7.3GB", latency_category: "Balanced", description: "Generalist — balanced summarization & chat (13B)." },
    { name: "llama2:70b", status: "downloadable", size: "39GB", latency_category: "Large", description: "Generalist — balanced summarization & chat (70B)." },
    { name: "llama3.2:13b", status: "downloadable", size: "7.4GB", latency_category: "Balanced", description: "Instruction-tuned multilingual for dialogue & summaries." },
    { name: "llama3.2:70b", status: "downloadable", size: "40GB", latency_category: "Large", description: "Instruction-tuned multilingual for dialogue & summaries." },
    { name: "gemma3:4b", status: "downloadable", size: "2.3GB", latency_category: "Fast", description: "Efficient reasoning & instruction-following (4B)." },
    { name: "gemma3:12b", status: "downloadable", size: "6.8GB", latency_category: "Balanced", description: "Efficient reasoning & instruction-following (12B)." },
    { name: "gemma3:27b", status: "downloadable", size: "15GB", latency_category: "Large", description: "Efficient reasoning & instruction-following (27B)." },
    { name: "qwen3:4b", status: "downloadable", size: "2.5GB", latency_category: "Fast", description: "Optimized language & code models (4B)." },
    { name: "qwen3:8b", status: "downloadable", size: "4.7GB", latency_category: "Balanced", description: "Optimized language & code models (8B)." },
    { name: "qwen3:30b", status: "downloadable", size: "17GB", latency_category: "Large", description: "Optimized language & code models (30B)." },
    { name: "qwen3-coder:30b", status: "downloadable", size: "17GB", latency_category: "Large", description: "Optimized language & code models (coder)." },
    { name: "gpt-oss:20b", status: "downloadable", size: "11GB", latency_category: "Balanced", description: "Open-source GPT-style generalist (20B)." },
    { name: "gpt-oss:120b", status: "cloud", size: "67GB", latency_category: "Large", description: "Open-source GPT-style generalist (120B)." },
    { name: "deepsseek-v3:671b", status: "cloud", size: "300GB+", latency_category: "Large", description: "High-performance large-scale model (cloud available)." },
    { name: "llava", status: "downloadable", size: "4.7GB", latency_category: "Large", description: "Vision+Language — image-aware queries/screenshots." },
    { name: "granite:128k", status: "downloadable", size: "8.1GB", latency_category: "Large", description: "Long-context reasoning (128K tokens) for big transcripts." },
    { name: "bge-m3", status: "downloadable", size: "1.2GB", latency_category: "Fast", description: "Fast embeddings for semantic search & transcript indexing." },
    { name: "general-local", status: "local", size: "2GB", latency_category: "Balanced", description: "General-purpose local model." }
  ];

  // Load data and handle localStorage persistence
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredModels(filtered);
  }, [models, searchQuery]);

  const loadInitialData = () => {
    // Load downloaded models from localStorage
    const downloadedModels = JSON.parse(localStorage.getItem('nexus_model_downloaded') || '[]');
    const savedPrimary = localStorage.getItem('nexus_model_primary') || '';
    
    // Update mock models with downloaded status
    const updatedModels = mockModels.map(model => ({
      ...model,
      status: downloadedModels.includes(model.name) ? 'local' as const : model.status
    }));
    
    setModels(updatedModels);
    setPrimaryModel(savedPrimary);
    setPinnedModel(savedPrimary);
    setIsPinned(!!savedPrimary);
  };

  const handleDownload = (modelName: string) => {
    // Start download simulation
    setModels(prev => prev.map(m => 
      m.name === modelName 
        ? { ...m, downloading: true, progress: 0 }
        : m
    ));

    // Simulate download progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20% per step
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Mark as downloaded and save to localStorage
        const downloadedModels = JSON.parse(localStorage.getItem('nexus_model_downloaded') || '[]');
        if (!downloadedModels.includes(modelName)) {
          downloadedModels.push(modelName);
          localStorage.setItem('nexus_model_downloaded', JSON.stringify(downloadedModels));
        }
        
        setModels(prev => prev.map(m =>
          m.name === modelName
            ? { ...m, status: "local", downloading: false, progress: 100 }
            : m
        ));
        
        toast({
          title: "Model downloaded successfully!",
          description: `${modelName} is now available locally`,
        });
      } else {
        setModels(prev => prev.map(m =>
          m.name === modelName
            ? { ...m, progress }
            : m
        ));
      }
    }, Math.random() * 500 + 300); // Random interval between 300-800ms
  };

  const handleCancelDownload = (modelName: string) => {
    setModels(prev => prev.map(m =>
      m.name === modelName
        ? { ...m, downloading: false, progress: 0 }
        : m
    ));
    
    toast({
      title: "Download cancelled",
      description: `Cancelled download of ${modelName}`,
    });
  };

  const handleUseModel = (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    const isLocal = model?.status === 'local';
    
    setPrimaryModel(modelName);
    onModelSelect(modelName, isLocal);
    
    // If pinned, save to localStorage
    if (isPinned) {
      localStorage.setItem('nexus_model_primary', modelName);
      setPinnedModel(modelName);
    }
    
    toast({
      title: "Model selected",
      description: `Now using ${modelName}${isPinned ? ' (pinned as default)' : ''}`,
    });
    
    onClose();
  };

  const toggleFallback = (modelName: string) => {
    setFallbackModels(prev =>
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const handlePinToggle = (checked: boolean) => {
    setIsPinned(checked);
    if (!checked) {
      // Unpin current model
      localStorage.removeItem('nexus_model_primary');
      setPinnedModel('');
      toast({
        title: "Model unpinned",
        description: "No default model set",
      });
    } else if (primaryModel) {
      // Pin current primary model
      localStorage.setItem('nexus_model_primary', primaryModel);
      setPinnedModel(primaryModel);
      toast({
        title: "Model pinned",
        description: `${primaryModel} set as default`,
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const localModels = filteredModels.filter(m => m.status === "local");
  const downloadableModels = filteredModels.filter(m => m.status === "downloadable");
  const cloudModels = filteredModels.filter(m => m.status === "cloud");
  
  const isPrimaryLocal = models.find(m => m.name === primaryModel)?.status === "local";

  const getLatencyIcon = (category: string) => {
    switch (category) {
      case "Fast": return <Zap className="w-4 h-4 text-success" />;
      case "Balanced": return <Clock className="w-4 h-4 text-warning" />;
      case "Large": return <Database className="w-4 h-4 text-destructive" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "local": return <Circle className="w-3 h-3 fill-current text-success" />;
      case "downloadable": return <Download className="w-3 h-3 text-primary" />;
      case "cloud": return <Cloud className="w-3 h-3 text-muted-foreground" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Model Picker</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isPrimaryLocal ? "default" : "destructive"}
                className={isPrimaryLocal ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}
              >
                Local Model: {isPrimaryLocal ? "ON" : "OFF"}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search models... (use Ctrl/Cmd+M to open this modal)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Primary model selection and pin option */}
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <Label htmlFor="pin-toggle" className="text-sm font-medium">
                Pin as default model
              </Label>
              <Checkbox
                id="pin-toggle"
                checked={isPinned}
                onCheckedChange={handlePinToggle}
              />
            </div>
            {pinnedModel && (
              <Badge variant="outline" className="text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {pinnedModel}
              </Badge>
            )}
          </div>

          <div className="overflow-y-auto max-h-96 space-y-6">
            {/* Local Models */}
            {localModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  <Circle className="w-3 h-3 fill-current" />
                  Local Models ({localModels.length})
                </h3>
                <RadioGroup value={primaryModel} onValueChange={(value) => setPrimaryModel(value)}>
                  <div className="space-y-2">
                    {localModels.map((model) => (
                      <div key={model.name} className="border rounded-lg p-4 hover:bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <RadioGroupItem value={model.name} id={model.name} />
                            <Label htmlFor={model.name} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(model.status)}
                                <span className="font-medium">{model.name}</span>
                                {getLatencyIcon(model.latency_category)}
                                <Badge variant="outline" className="text-xs">
                                  {model.latency_category}
                                </Badge>
                                {model.size && (
                                  <Badge variant="secondary" className="text-xs">
                                    {model.size}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{model.description}</p>
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleUseModel(model.name)}
                              size="sm"
                              className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Downloadable Models */}
            {downloadableModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Available to Download ({downloadableModels.length})
                </h3>
                <div className="space-y-2">
                  {downloadableModels.map((model) => (
                    <div key={model.name} className="border rounded-lg p-4 hover:bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(model.status)}
                            <span className="font-medium">{model.name}</span>
                            {getLatencyIcon(model.latency_category)}
                            <Badge variant="outline" className="text-xs">
                              {model.latency_category}
                            </Badge>
                            {model.size && (
                              <Badge variant="secondary" className="text-xs">
                                {model.size}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                          {model.downloading && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Downloading... {Math.round(model.progress || 0)}%
                                </span>
                                <Button
                                  onClick={() => handleCancelDownload(model.name)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <Progress value={model.progress || 0} className="h-2" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleDownload(model.name)}
                            disabled={model.downloading}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {model.downloading ? "Downloading..." : "Download"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cloud Models */}
            {cloudModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Cloud className="w-3 h-3" />
                  Cloud Models ({cloudModels.length})
                </h3>
                <div className="space-y-2">
                  {cloudModels.map((model) => (
                    <div key={model.name} className="border rounded-lg p-4 hover:bg-muted/20 opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(model.status)}
                            <span className="font-medium">{model.name}</span>
                            {getLatencyIcon(model.latency_category)}
                            <Badge variant="outline" className="text-xs">
                              {model.latency_category}
                            </Badge>
                            {model.size && (
                              <Badge variant="secondary" className="text-xs">
                                {model.size}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="opacity-50"
                          >
                            <Cloud className="w-4 h-4 mr-1" />
                            Cloud Only
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};