import { useState, useEffect } from "react";
import { Search, Download, Check, Circle, Star, Zap, Clock, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface OllamaModel {
  name: string;
  status: "local" | "remote";
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
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<OllamaModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [primaryModel, setPrimaryModel] = useState(selectedModel);
  const [fallbackModels, setFallbackModels] = useState<string[]>([]);
  const [pinnedModel, setPinnedModel] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredModels(filtered);
  }, [models, searchQuery]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ollama/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        // Fallback mock data for development
        setModels([
          {
            name: "smollm2:135m",
            status: "local",
            size: "135MB",
            latency_category: "Fast",
            description: "Tiny & fast — quick replies, limited depth."
          },
          {
            name: "llama2",
            status: "local", 
            size: "3.8GB",
            latency_category: "Balanced",
            description: "Generalist — balanced on summarization & chat (7B/13B/70B options)."
          },
          {
            name: "llama3.2",
            status: "remote",
            size: "2.0GB",
            latency_category: "Balanced", 
            description: "Instruction-tuned multilingual for better dialogue & summaries."
          },
          {
            name: "gemma2",
            status: "remote",
            size: "1.6GB",
            latency_category: "Fast",
            description: "Efficient reasoning & instruction-following (if available locally)."
          },
          {
            name: "llava",
            status: "remote",
            size: "4.7GB", 
            latency_category: "Large",
            description: "Vision+Language — use for image-aware searches/screenshots."
          },
          {
            name: "granite",
            status: "remote",
            size: "8.1GB",
            latency_category: "Large", 
            description: "Long-context reasoning (128K context) for big transcripts."
          },
          {
            name: "bge-m3",
            status: "remote",
            size: "1.2GB",
            latency_category: "Fast",
            description: "Fast embeddings for semantic search & transcript indexing."
          }
        ]);
      }
    } catch (error) {
      toast({
        title: "Failed to fetch models",
        description: "Using fallback model list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (modelName: string) => {
    setModels(prev => prev.map(m => 
      m.name === modelName 
        ? { ...m, downloading: true, progress: 0 }
        : m
    ));

    try {
      const response = await fetch('/api/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });

      if (response.ok) {
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            clearInterval(progressInterval);
            setModels(prev => prev.map(m =>
              m.name === modelName
                ? { ...m, status: "local", downloading: false, progress: 100 }
                : m
            ));
            toast({
              title: "Model downloaded",
              description: `${modelName} is now available locally`
            });
          } else {
            setModels(prev => prev.map(m =>
              m.name === modelName
                ? { ...m, progress }
                : m
            ));
          }
        }, 500);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setModels(prev => prev.map(m =>
        m.name === modelName
          ? { ...m, downloading: false, progress: 0 }
          : m
      ));
      toast({
        title: "Download failed",
        description: `Failed to download ${modelName}`,
        variant: "destructive"
      });
    }
  };

  const handleUseModel = (modelName: string, isLocal: boolean) => {
    setPrimaryModel(modelName);
    onModelSelect(modelName, isLocal);
    onClose();
  };

  const toggleFallback = (modelName: string) => {
    setFallbackModels(prev =>
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const pinModel = async (modelName: string) => {
    try {
      await fetch('/api/user/settings/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedModel: modelName })
      });
      setPinnedModel(modelName);
      toast({
        title: "Model pinned",
        description: `${modelName} set as default`
      });
    } catch (error) {
      toast({
        title: "Failed to pin model",
        variant: "destructive"
      });
    }
  };

  const localModels = filteredModels.filter(m => m.status === "local");
  const remoteModels = filteredModels.filter(m => m.status === "remote");
  const allSelectedLocal = [primaryModel, ...fallbackModels].every(model =>
    models.find(m => m.name === model)?.status === "local"
  );

  const getLatencyIcon = (category: string) => {
    switch (category) {
      case "Fast": return <Zap className="w-4 h-4 text-green-500" />;
      case "Balanced": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Large": return <Database className="w-4 h-4 text-red-500" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Local Model Picker</span>
            <Badge 
              variant={allSelectedLocal ? "default" : "destructive"}
              className={allSelectedLocal ? "bg-green-500" : ""}
            >
              Local Model: {allSelectedLocal ? "ON" : "OFF"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto max-h-96 space-y-6">
            {/* Local Models */}
            {localModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <Circle className="w-3 h-3 fill-current" />
                  Local Models ({localModels.length})
                </h3>
                <div className="space-y-2">
                  {localModels.map((model) => (
                    <div key={model.name} className="border rounded-lg p-4 hover:bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Circle className="w-3 h-3 fill-current text-green-500" />
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
                          <Checkbox
                            checked={fallbackModels.includes(model.name)}
                            onCheckedChange={() => toggleFallback(model.name)}
                            title="Use as fallback"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pinModel(model.name)}
                            className={pinnedModel === model.name ? "text-yellow-500" : ""}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleUseModel(model.name, true)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remote Models */}
            {remoteModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Available to Download ({remoteModels.length})
                </h3>
                <div className="space-y-2">
                  {remoteModels.map((model) => (
                    <div key={model.name} className="border rounded-lg p-4 hover:bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Download className="w-3 h-3 text-orange-500" />
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
                            <div className="mt-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${model.progress || 0}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Downloading... {Math.round(model.progress || 0)}%
                              </p>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};