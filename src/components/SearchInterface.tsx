import { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, Loader2, Zap, Image as ImageIcon, X, Monitor, GraduationCap, Dumbbell, Newspaper, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import { ImageUpload } from "@/components/ImageUpload";
import { ModelChip } from "@/components/ModelChip";
// Removed Ollama API imports for UI-only implementation

interface SearchInterfaceProps {
  onSearch: (query: string, imageFile?: File, imageUrl?: string, model?: string) => void;
  isLoading?: boolean;
}

export const SearchInterface = ({ onSearch, isLoading = false }: SearchInterfaceProps) => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("llama2");
  const [isLocalModel, setIsLocalModel] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with some local models by default
    const defaultDownloaded = ['smollm2:135m', 'llama2:7b', 'general-local'];
    const defaultPrimary = 'llama2:7b';
    
    // Set defaults if not already set
    if (!localStorage.getItem('nexus_model_downloaded')) {
      localStorage.setItem('nexus_model_downloaded', JSON.stringify(defaultDownloaded));
    }
    if (!localStorage.getItem('nexus_model_primary')) {
      localStorage.setItem('nexus_model_primary', defaultPrimary);
    }
    
    const savedModel = localStorage.getItem('nexus_model_primary') || defaultPrimary;
    const downloadedModels = JSON.parse(localStorage.getItem('nexus_model_downloaded') || JSON.stringify(defaultDownloaded));
    
    setSelectedModel(savedModel);
    setIsLocalModel(downloadedModels.includes(savedModel));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Allow search with text, image, or both
    if ((query.trim() || uploadedImage) && !isLoading && !isUploading && !isProcessing) {
      onSearch(query.trim(), uploadedImage || undefined, uploadedImageUrl || undefined, selectedModel);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Start speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = () => setIsListening(false);
        recognition.start();
      }
    }
  };

  // Image upload handlers
  const handleImageSelect = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 100);

      // Simulate image processing since we don't have a real backend yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setIsProcessing(true);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a local URL for the image
      const imageUrl = URL.createObjectURL(file);
      setUploadedImageUrl(imageUrl);
      setExtractedText("Image processed successfully");
      setIsProcessing(false);
      
      toast({
        title: "Image uploaded successfully",
        description: "Processing results...",
      });

      // Auto-search after upload completes
      setTimeout(() => {
        if (query.trim() || file) {
          onSearch(query.trim(), file, imageUrl, selectedModel);
        }
      }, 500);
      
    } catch (error) {
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUploadCancel = () => {
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setExtractedText(null);
    setIsUploading(false);
    setIsProcessing(false);
    setUploadProgress(0);
    setShowImageUpload(false);
  };

  const quickSearches = [
    {
      query: "32 inch smart TV under 30000",
      category: "Tech",
      description: "Smart TVs with 4K, HDR support",
      icon: "Monitor",
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      query: "best coding bootcamp online courses",
      category: "Education", 
      description: "Full-stack development programs",
      icon: "GraduationCap",
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      query: "home gym equipment for beginners",
      category: "Fitness",
      description: "Dumbbells, resistance bands, yoga mats",
      icon: "Dumbbell",
      color: "bg-orange-500/10 text-orange-600 border-orange-200"
    },
    {
      query: "latest tech news today",
      category: "News",
      description: "AI, gadgets, startup updates",
      icon: "Newspaper",
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    },
    {
      query: "python data structures tutorial",
      category: "Coding",
      description: "Lists, dictionaries, algorithms",
      icon: "Code2",
      color: "bg-red-500/10 text-red-600 border-red-200"
    },
    {
      query: "AI image generator tools 2024",
      category: "AI",
      description: "DALL-E, Midjourney, Stable Diffusion",
      icon: "Sparkles",
      color: "bg-pink-500/10 text-pink-600 border-pink-200"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Image Upload Card */}
      {showImageUpload && (
        <div className="mb-4">
          <ImageUpload
            onImageSelect={(file) => {
              setUploadedImage(file);
              handleImageSelect(file);
            }}
            onUploadProgress={setUploadProgress}
            onUploadComplete={(imageUrl, text) => {
              setUploadedImageUrl(imageUrl);
              setExtractedText(text);
            }}
            onUploadError={(error) => {
              toast({
                title: "Upload Error",
                description: error,
                variant: "destructive",
              });
            }}
            onCancel={handleUploadCancel}
            isUploading={isUploading}
            isProcessing={isProcessing}
            uploadProgress={uploadProgress}
          />
        </div>
      )}

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="relative group">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uploadedImage ? "Add text to your image search..." : "Type anything… NexusAI will search, rank, and explain it for you."}
            className="h-16 pl-6 pr-44 text-lg rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm focus:border-primary focus:shadow-neural transition-all duration-300"
            disabled={isLoading || isUploading || isProcessing}
          />
          
          <div className="absolute right-2 top-2 flex items-center gap-2">
            <ModelChip 
              selectedModel={selectedModel}
              isLocal={isLocalModel}
              onModelChange={(model, isLocal) => {
                setSelectedModel(model);
                setIsLocalModel(isLocal);
                // No need to save here as ModelPickerModal handles localStorage
              }}
              disabled={isLoading || isUploading || isProcessing}
            />
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`h-12 w-12 rounded-xl transition-all duration-300 ${
                showImageUpload || uploadedImage
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted/20"
              }`}
              disabled={isLoading || isUploading || isProcessing}
              title="Upload image"
            >
              {uploadedImage ? <X className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              className={`h-12 w-12 rounded-xl transition-all duration-300 ${
                isListening 
                  ? "bg-destructive text-destructive-foreground neural-pulse" 
                  : "hover:bg-muted/20"
              }`}
              disabled={isLoading || isUploading || isProcessing}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button
              type="submit"
              disabled={(!query.trim() && !uploadedImage) || isLoading || isUploading || isProcessing}
              className="h-12 px-6 rounded-xl bg-gradient-primary hover:shadow-neural transition-all duration-300"
            >
              {isLoading || isUploading || isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search Status */}
        {(isLoading || isUploading || isProcessing) && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>
                {isUploading && "Uploading image..."}
                {isProcessing && "Processing image..."}
                {isLoading && "Searching across Flipkart, Amazon, Croma..."}
              </span>
            </div>
          </div>
        )}
      </form>

      {/* Helper Text */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          <em>Example: "Find laptops under 50k"</em>
        </p>
      </div>

      {/* Quick Search Suggestions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-6">Try these popular searches:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {quickSearches.map((search, index) => {
            const IconComponent = {
              Monitor,
              GraduationCap,
              Dumbbell,
              Newspaper,
              Code2,
              Sparkles
            }[search.icon as keyof typeof IconComponent] || Search;

            return (
              <button
                key={index}
                onClick={() => {
                  if (loading) return;
                  
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  
                  setQuery(search.query);
                  onSearch(search.query, undefined, undefined, selectedModel);
                }}
                disabled={isLoading}
                className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none text-left ${search.color}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-current/10">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-current/10">
                        {search.category}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1 group-hover:text-current transition-colors line-clamp-2">
                      {search.query}
                    </h3>
                    <p className="text-xs opacity-70 line-clamp-2">
                      {search.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Features Indicator */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <span>Multi-site fusion</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <span>Smart deduplication</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '1s' }}></div>
          <span>Explainable traces</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <span>Replayable scripts</span>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}