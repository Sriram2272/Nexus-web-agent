import { useLocation, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Star, Shield, Truck, Eye } from "lucide-react";

const Details = () => {
  const { id } = useParams();
  const location = useLocation();
  const { result, query } = location.state || {};

  if (!result) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Card className="p-6">
                <img src={result.imageUrl} alt={result.title} className="w-full aspect-square object-cover rounded-lg mb-4" />
                <h1 className="text-2xl font-bold mb-4">{result.title}</h1>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-primary">
                      {result.currency}{result.price.toLocaleString()}
                    </span>
                    <Badge variant="outline">{result.source}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      <span>{result.rating} ({result.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>{result.seller}</span>
                    </div>
                  </div>

                  <Button className="w-full" asChild>
                    <a href={result.productUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on {result.source}
                    </a>
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Explainable Trace
                </h2>
                <div className="space-y-4">
                  {result.trace.map((step, index) => (
                    <div key={step.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{step.action}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          {step.screenshot && (
                            <img src={step.screenshot} alt={`Step ${step.step}`} className="w-full h-32 object-cover rounded mb-2" />
                          )}
                          {step.details && (
                            <p className="text-xs text-accent">{step.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;