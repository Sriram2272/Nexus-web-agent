import { useState, useRef } from "react";
import { Search, Mic, MicOff, Loader2, Zap, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import { ImageUpload } from "@/components/ImageUpload";

interface SearchInterfaceProps {
  onSearch: (query: string, imageFile?: File, imageUrl?: string) => void;
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
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Allow search with text, image, or both
    if ((query.trim() || uploadedImage) && !isLoading && !isUploading && !isProcessing) {
      onSearch(query.trim(), uploadedImage || undefined, uploadedImageUrl || undefined);
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

      // TODO: Replace with actual upload to Supabase edge function
      const response = await fetch('/api/image-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setIsProcessing(true);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadedImageUrl(result.imageUrl);
      setExtractedText(result.extractedText);
      setIsProcessing(false);
      
      toast({
        title: "Image uploaded successfully",
        description: "Processing results...",
      });

      // Auto-search after upload completes
      setTimeout(() => {
        if (query.trim() || file) {
          onSearch(query.trim(), file, result.imageUrl);
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
    "32 inch smart TV under 30000",
    "gaming laptop RTX 4060",
    "wireless earbuds noise cancelling",
    "iPhone 15 Pro best price",
    "coffee machine automatic"
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
            placeholder={uploadedImage ? "Add text to your image search..." : "Search across multiple e-commerce sites..."}
            className="h-16 pl-6 pr-44 text-lg rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm focus:border-primary focus:shadow-neural transition-all duration-300"
            disabled={isLoading || isUploading || isProcessing}
          />
          
          <div className="absolute right-2 top-2 flex items-center gap-2">
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

      {/* Quick Search Suggestions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Try these popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {quickSearches.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                if (loading) return;
                
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                
                setQuery(suggestion);
                onSearch(suggestion);
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-full border border-border bg-card/30 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all duration-300 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
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