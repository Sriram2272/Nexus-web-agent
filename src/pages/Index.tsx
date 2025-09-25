import { useState } from "react";
import { SearchInterface } from "@/components/SearchInterface";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExportPanel } from "@/components/ExportPanel";
import { DemoMode } from "@/components/DemoMode";
import { Navigation } from "@/components/Navigation";
import { mockSearchResults } from "@/lib/mockData";
import { SearchResult } from "@/types";

const Index = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-neural opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">
                AI-Powered Multi-Site Navigator
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient-neural">WebNavigatorAI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Search across multiple e-commerce sites simultaneously. Get ranked results, 
              explainable traces, and replayable automation scripts.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-all duration-300 neural-glow"
              >
                {showDemo ? "Hide Demo" : "🎬 Demo Mode"}
              </button>
              
              <div className="px-4 py-3 rounded-lg bg-muted/20 text-muted-foreground text-sm">
                🔒 100% Local Processing • 🚀 Real-time Scraping • 🎯 Smart Ranking
              </div>
            </div>
          </div>

          {/* Demo Mode */}
          {showDemo && (
            <div className="mb-12">
              <DemoMode />
            </div>
          )}

          {/* Search Interface */}
          <div className="max-w-4xl mx-auto">
            <SearchInterface onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      {(searchResults.length > 0 || isLoading) && (
        <section className="py-16 bg-muted/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <ResultsDisplay 
                  results={searchResults} 
                  isLoading={isLoading}
                  query={currentQuery}
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="lg:w-80">
                  <ExportPanel results={searchResults} query={currentQuery} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gradient-primary">
            Why WebNavigatorAI?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl glass-effect hover:shadow-accent transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Site Fusion</h3>
              <p className="text-muted-foreground">
                Search across multiple e-commerce platforms simultaneously with intelligent deduplication.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl glass-effect hover:shadow-secondary transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Explainable AI</h3>
              <p className="text-muted-foreground">
                Every result includes a human-readable trace showing exactly how it was found.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl glass-effect hover:shadow-accent transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Replayable Scripts</h3>
              <p className="text-muted-foreground">
                Generate Playwright scripts to reproduce any search session automatically.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;