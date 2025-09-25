export interface SearchResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  seller: string;
  sellerRating: number;
  shipping: string;
  availability: string;
  warranty?: string;
  imageUrl: string;
  productUrl: string;
  source: string;
  
  // AI Scoring
  aiScore: number;
  aiReason: string;
  
  // Explainable Trace
  trace: SearchTrace[];
}

export interface SearchTrace {
  id: string;
  step: number;
  action: string;
  description: string;
  screenshot?: string;
  domSnippet?: string;
  timestamp: string;
  success: boolean;
  details?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  executionTime: number;
  sources: string[];
  replayScript?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'replay';
  includeTraces: boolean;
  includeScreenshots: boolean;
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  screenshot: string;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  duration: number;
}