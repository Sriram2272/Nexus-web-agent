import { useState } from "react";
import { SearchResult } from "@/types";
import { Star, ExternalLink, Eye, Zap, TrendingUp, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading?: boolean;
  query: string;
}

export const ResultsDisplay = ({ results, isLoading = false, query }: ResultsDisplayProps) => {
  const [sortBy, setSortBy] = useState<'aiScore' | 'price' | 'rating'>('aiScore');
  const navigate = useNavigate();

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return b.aiScore - a.aiScore;
    }
  });

  const handleViewDetails = (result: SearchResult) => {
    navigate(`/details/${result.id}`, { state: { result, query } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-neural rounded-2xl mx-auto mb-4 flex items-center justify-center neural-pulse">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI Search in Progress</h3>
          <p className="text-muted-foreground">Analyzing products across multiple sites...</p>
        </div>
        
        {/* Loading Skeletons */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Eye className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
        <p className="text-muted-foreground">Try a different search term or check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            Search Results for "{query}"
          </h2>
          <p className="text-muted-foreground">
            Found {results.length} products across {[...new Set(results.map(r => r.source))].length} sites
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex rounded-lg border border-border p-1">
            {[
              { key: 'aiScore', label: 'AI Score', icon: Zap },
              { key: 'price', label: 'Price', icon: TrendingUp },
              { key: 'rating', label: 'Rating', icon: Star }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition-all duration-200 ${
                  sortBy === key
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted/20'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {sortedResults.map((result, index) => (
          <Card key={result.id} className="p-6 hover:shadow-lg transition-all duration-300 group slide-in-right" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-muted/20 rounded-lg overflow-hidden">
                  <img 
                    src={result.imageUrl} 
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {result.title}
                  </h3>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {result.source}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current text-yellow-500" />
                    <span>{result.rating}</span>
                    <span>({result.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>{result.seller}</span>
                    <span className="text-accent">({result.sellerRating}★)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>{result.shipping}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {result.currency}{result.price.toLocaleString()}
                      </span>
                      {result.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {result.currency}{result.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                        <Zap className="w-3 h-3" />
                        <span>AI Score: {result.aiScore}/10</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(result)}
                      className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:shadow-neural transition-all duration-200"
                      asChild
                    >
                      <a href={result.productUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>

                {/* AI Reason */}
                <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-sm text-accent-foreground">
                    <strong>AI Analysis:</strong> {result.aiReason}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};