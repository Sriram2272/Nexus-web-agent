import { mockSearchHistory } from "@/lib/mockData";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Clock, Download, Play } from "lucide-react";

const History = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gradient-neural">Search History</h1>
            <p className="text-xl text-muted-foreground">Your previous WebNavigatorAI searches and replays</p>
          </div>

          <div className="space-y-4">
            {mockSearchHistory.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <HistoryIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{item.query}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <span>{item.resultCount} results</span>
                        <span>{item.executionTime}s</span>
                        <span>{item.sources.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.replayScript && (
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Replay
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;