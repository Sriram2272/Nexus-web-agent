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

  const handleSearch = async (query: string, imageFile?: File, imageUrl?: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
    
    // Simulate API call delay with different messaging for image searches
    setTimeout(() => {
      // Add image search indicator to results if image was used
      const resultsWithImageTag = imageFile || imageUrl 
        ? mockSearchResults.map(result => ({
            ...result,
            source: result.source + (query ? ' (Text + Image)' : ' (Image)')
          }))
        : mockSearchResults;
      
      setSearchResults(resultsWithImageTag);
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
              <span className="text-gradient-nexus">NexusAI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Search across multiple e-commerce sites simultaneously. Get ranked results, 
              explainable traces, and replayable automation scripts.
            </p>

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


      {/* Footer */}
      <footer className="py-8 bg-muted/5 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by NexusAI • CodeCatalysts Team
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;