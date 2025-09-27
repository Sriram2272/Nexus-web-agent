import { useState } from "react";
import { SearchInterface } from "@/components/SearchInterface";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExportPanel } from "@/components/ExportPanel";
import { DemoMode } from "@/components/DemoMode";
import { Navigation } from "@/components/Navigation";
import { AIToolsSelector } from "@/components/AIToolsSelector";
import { CodingAssistant } from "@/components/CodingAssistant";
import { AIResponseDisplay } from "@/components/AIResponseDisplay";
import { VideoCallButton } from "@/components/VideoCallButton";
import { CreateCallModal, type CallConfig } from "@/components/CreateCallModal";
import { VideoCallScreen } from "@/components/VideoCallScreen";
import { AutoDemoVideoCall } from "@/components/AutoDemoVideoCall";
import { RecordingList } from "@/components/RecordingList";
import { personas } from "@/data/personas";
import { mockSearchResults, mockCodingResults, generateMockAIResponse } from "@/lib/mockData";
import { detectQueryType, getSuggestedAIMode } from "@/utils/queryDetection";
import { SearchResult, QueryType, AIToolMode, CodingResult, AIResponse } from "@/types";

const Index = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [queryType, setQueryType] = useState<QueryType>('general');
  const [selectedAIMode, setSelectedAIMode] = useState<AIToolMode>('quick');
  const [codingResults, setCodingResults] = useState<CodingResult[]>([]);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [suggestedModes, setSuggestedModes] = useState<string[]>([]);
  
  // Video call states
  const [showCreateCall, setShowCreateCall] = useState(false);
  const [activeCall, setActiveCall] = useState<CallConfig | null>(null);
  const [showRecordings, setShowRecordings] = useState(false);

  const handleSearch = async (query: string, imageFile?: File, imageUrl?: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
    
    // Reset previous results
    setSearchResults([]);
    setCodingResults([]);
    setAiResponse(null);
    
    // Detect query type and set suggested modes
    const detectedType = detectQueryType(query);
    setQueryType(detectedType);
    
    const suggested = getSuggestedAIMode(detectedType);
    setSuggestedModes(suggested);
    
    // Set default AI mode based on query type
    if (detectedType === 'coding' && !suggested.includes(selectedAIMode)) {
      setSelectedAIMode('coding');
    } else if (detectedType === 'research' && !suggested.includes(selectedAIMode)) {
      setSelectedAIMode('research');
    }
    
    // Simulate API call delay with different messaging for image searches
    setTimeout(() => {
      if (detectedType === 'coding') {
        // Show coding results for DSA/programming queries
        setCodingResults(mockCodingResults);
        setAiResponse(generateMockAIResponse(query, selectedAIMode));
      } else if (detectedType === 'product') {
        // Show product results for shopping queries
        const resultsWithImageTag = imageFile || imageUrl 
          ? mockSearchResults.map(result => ({
              ...result,
              source: result.source + (query ? ' (Text + Image)' : ' (Image)')
            }))
          : mockSearchResults;
        
        setSearchResults(resultsWithImageTag);
        setAiResponse(generateMockAIResponse(query, selectedAIMode));
      } else {
        // Show AI response for research/general queries
        setAiResponse(generateMockAIResponse(query, selectedAIMode));
      }
      
      setIsLoading(false);
    }, 2000);
  };

  const handleAIModeChange = (mode: AIToolMode) => {
    setSelectedAIMode(mode);
    
    // Generate new AI response if we have a query
    if (currentQuery) {
      const newResponse = generateMockAIResponse(currentQuery, mode);
      setAiResponse(newResponse);
    }
  };

  const handleStartCall = (config: CallConfig) => {
    setShowCreateCall(false);
    setActiveCall(config);
  };

  const handleStartDemoCall = () => {
    // Start demo call directly without modal
    const demoConfig: CallConfig = {
      persona: personas[0], // Health Coach
      title: 'Demo Health Consultation',
      duration: 30,
      voice: 'default',
      enableMic: false
    };
    setActiveCall(demoConfig);
  };

  const handleEndCall = (recording: any) => {
    setActiveCall(null);
    // Show recordings after demo call
    setShowRecordings(true);
  };

  // If in active call, show auto demo video call screen
  if (activeCall) {
    return <AutoDemoVideoCall config={activeCall} onEndCall={handleEndCall} />;
  }

  // If showing recordings, show recordings list
  if (showRecordings) {
    return <RecordingList onClose={() => setShowRecordings(false)} />;
  }

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
            
            {/* Video Call Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <VideoCallButton onClick={handleStartDemoCall} />
              <VideoCallButton 
                onClick={() => setShowRecordings(true)} 
                variant="recordings"
              />
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

      {/* AI Tools & Results Section */}
      {(searchResults.length > 0 || codingResults.length > 0 || aiResponse || isLoading) && (
        <section className="py-16 bg-muted/5">
          <div className="container mx-auto px-4">
            
            {/* AI Tools Selector */}
            {currentQuery && (
              <div className="mb-8">
                <AIToolsSelector
                  selectedMode={selectedAIMode}
                  onModeChange={handleAIModeChange}
                  suggestedModes={suggestedModes}
                />
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-8">
                
                {/* Coding Assistant Panel */}
                {queryType === 'coding' && (
                  <CodingAssistant
                    results={codingResults}
                    query={currentQuery}
                  />
                )}
                
                {/* Product Results */}
                {queryType === 'product' && (
                  <ResultsDisplay 
                    results={searchResults} 
                    isLoading={isLoading}
                    query={currentQuery}
                  />
                )}
                
                {/* AI Response Display */}
                {aiResponse && (
                  <AIResponseDisplay response={aiResponse} />
                )}
                
                {/* Loading State */}
                {isLoading && !aiResponse && !searchResults.length && !codingResults.length && (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        {queryType === 'coding' ? 'Analyzing algorithm and generating solutions...' : 
                         queryType === 'product' ? 'Searching across multiple sites...' :
                         'Processing your query...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Export Panel */}
              {(searchResults.length > 0 || codingResults.length > 0) && (
                <div className="lg:w-80">
                  <ExportPanel 
                    results={searchResults.length > 0 ? searchResults : []} 
                    query={currentQuery} 
                  />
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