import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Zap, 
  Check, 
  X,
  Video,
  MessageSquare,
  Search,
  Clock,
  Users,
  Shield
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingTier {
  name: string;
  price: string;
  currency: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: { text: string; included: boolean }[];
  isPopular?: boolean;
  isCurrent?: boolean;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const pricingTiers: PricingTier[] = [
    {
      name: 'NexusAI Free',
      price: '0',
      currency: '₹',
      period: 'Forever',
      description: 'Perfect for getting started',
      icon: <Search className="w-6 h-6" />,
      color: 'hsl(200, 50%, 60%)',
      isCurrent: true,
      features: [
        { text: '5 searches per day', included: true },
        { text: '2 video calls per day', included: true },
        { text: 'Basic AI responses', included: true },
        { text: 'Standard support', included: true },
        { text: 'Search history (7 days)', included: true },
        { text: 'Advanced AI features', included: false },
        { text: 'Priority support', included: false },
        { text: 'Unlimited searches', included: false },
        { text: 'Unlimited video calls', included: false }
      ]
    },
    {
      name: 'NexusAI Plus',
      price: '300',
      currency: '₹',
      period: 'per month',
      description: 'Great for regular users',
      icon: <Zap className="w-6 h-6" />,
      color: 'hsl(45, 100%, 51%)',
      isPopular: true,
      features: [
        { text: '100 searches per day', included: true },
        { text: '20 video calls per day', included: true },
        { text: 'Advanced AI responses', included: true },
        { text: 'Priority support', included: true },
        { text: 'Search history (30 days)', included: true },
        { text: 'Export results (PDF/Excel)', included: true },
        { text: 'Custom AI personas', included: true },
        { text: 'Unlimited searches', included: false },
        { text: 'Unlimited video calls', included: false }
      ]
    },
    {
      name: 'NexusAI Pro',
      price: '3000',
      currency: '₹',
      period: 'per month',
      description: 'Unlimited everything for professionals',
      icon: <Crown className="w-6 h-6" />,
      color: 'hsl(271, 81%, 56%)',
      features: [
        { text: 'Unlimited searches', included: true },
        { text: 'Unlimited video calls', included: true },
        { text: 'Advanced AI responses', included: true },
        { text: 'Premium support (24/7)', included: true },
        { text: 'Unlimited search history', included: true },
        { text: 'Export results (PDF/Excel)', included: true },
        { text: 'Custom AI personas', included: true },
        { text: 'API access', included: true },
        { text: 'White-label options', included: true }
      ]
    }
  ];

  const handleUpgrade = (tierName: string) => {
    // Here you would integrate with Stripe or payment processor
    console.log(`Upgrading to ${tierName}`);
    // For now, just show an alert
    alert(`Upgrade to ${tierName} - Payment integration coming soon!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-2">
            Choose Your NexusAI Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Unlock the full potential of AI-powered search and conversations
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`relative p-6 transition-all hover:shadow-lg ${
                tier.isPopular 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : tier.isCurrent
                  ? 'bg-muted/20'
                  : 'hover:bg-muted/10'
              }`}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Current Badge */}
              {tier.isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                >
                  {tier.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">{tier.currency}{tier.price}</span>
                  <span className="text-muted-foreground ml-2">/ {tier.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span 
                      className={`text-sm ${
                        feature.included 
                          ? 'text-foreground' 
                          : 'text-muted-foreground line-through'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button 
                className={`w-full ${
                  tier.isCurrent 
                    ? 'bg-muted text-muted-foreground cursor-default' 
                    : tier.isPopular
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
                onClick={() => !tier.isCurrent && handleUpgrade(tier.name)}
                disabled={tier.isCurrent}
              >
                {tier.isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
              </Button>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold mb-4 text-center">Feature Comparison</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Search className="w-4 h-4" />
                Daily Searches
              </div>
              <div className="text-muted-foreground">Free: 5 searches</div>
              <div className="text-muted-foreground">Plus: 100 searches</div>
              <div className="text-muted-foreground">Pro: Unlimited</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Video className="w-4 h-4" />
                Video Calls
              </div>
              <div className="text-muted-foreground">Free: 2 calls</div>
              <div className="text-muted-foreground">Plus: 20 calls</div>
              <div className="text-muted-foreground">Pro: Unlimited</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4" />
                History
              </div>
              <div className="text-muted-foreground">Free: 7 days</div>
              <div className="text-muted-foreground">Plus: 30 days</div>
              <div className="text-muted-foreground">Pro: Unlimited</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4" />
                Support
              </div>
              <div className="text-muted-foreground">Free: Standard</div>
              <div className="text-muted-foreground">Plus: Priority</div>
              <div className="text-muted-foreground">Pro: 24/7 Premium</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          <p>All plans include SSL security, regular updates, and access to new features.</p>
          <p className="mt-2">Cancel anytime. No hidden fees.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}