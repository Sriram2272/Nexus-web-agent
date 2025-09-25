import { useState } from "react";
import { Search, Mic, MicOff, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchInterface = ({ onSearch, isLoading = false }: SearchInterfaceProps) => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
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

  const quickSearches = [
    "32 inch smart TV under 30000",
    "gaming laptop RTX 4060",
    "wireless earbuds noise cancelling",
    "iPhone 15 Pro best price",
    "coffee machine automatic"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="relative group">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across multiple e-commerce sites..."
            className="h-16 pl-6 pr-32 text-lg rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm focus:border-primary focus:shadow-neural transition-all duration-300"
            disabled={isLoading}
          />
          
          <div className="absolute right-2 top-2 flex items-center gap-2">
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
              disabled={isLoading}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="h-12 px-6 rounded-xl bg-gradient-primary hover:shadow-neural transition-all duration-300"
            >
              {isLoading ? (
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
        {isLoading && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Searching across Flipkart, Amazon, Croma...</span>
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