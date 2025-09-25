import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthModal from "@/components/AuthModal";
import { 
  Search, 
  Mic, 
  Image as ImageIcon, 
  Zap, 
  Shield, 
  ArrowRight,
  ChevronDown
} from "lucide-react";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-poppins font-semibold text-lg">NexusAI</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={scrollToFeatures}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button 
              onClick={scrollToAbout}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="btn-glow"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="fade-in-up">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight font-poppins">
                <span className="text-gradient">NexusAI</span>
                <span className="block text-3xl md:text-5xl mt-4 text-foreground">
                  Your Intelligent Web Agent
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Built by <span className="text-primary font-semibold">CodeCatalysts</span> to make 
                online navigation effortless, powerful, and secure.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button 
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="text-lg px-8 py-4 btn-glow group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="text-lg px-8 py-4 border-primary/30 hover:border-primary/50"
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Floating illustration placeholder */}
            <div className="float-animation">
              <div className="w-32 h-32 mx-auto bg-gradient-primary rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of web navigation with our advanced AI-powered tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="glass-card hover:shadow-glow transition-all duration-500 scale-in group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4 font-poppins">Smart Search</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find what you need across the web in seconds with intelligent algorithms
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-glow transition-all duration-500 scale-in group" style={{animationDelay: '0.1s'}}>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div className="flex gap-1">
                    <Mic className="h-6 w-6 text-primary-foreground" />
                    <ImageIcon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 font-poppins">Voice & Image Input</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Search by typing, speaking, or uploading images for maximum flexibility
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-glow transition-all duration-500 scale-in group" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4 font-poppins">Fast & Reliable</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Optimized for speed, accuracy, and uptime with enterprise-grade infrastructure
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-glow transition-all duration-500 scale-in group" style={{animationDelay: '0.3s'}}>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4 font-poppins">Secure & Private</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your searches stay yours, always protected with end-to-end encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 font-poppins">
              Who We Are
            </h2>
            
            <div className="glass-card p-12 rounded-3xl">
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
                We are <span className="text-primary font-semibold">CodeCatalysts</span>, 
                a passionate team building AI-powered solutions to make the web smarter, 
                more accessible, and user-first.
              </p>
              
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  C
                </div>
                <span className="text-2xl font-poppins font-semibold text-gradient">
                  CodeCatalysts
                </span>
              </div>
              
              <p className="text-muted-foreground">
                Our mission is to democratize web navigation through intelligent automation, 
                making complex online tasks simple and accessible for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">N</span>
              </div>
              <span className="text-muted-foreground">
                © 2025 CodeCatalysts. All rights reserved.
              </span>
            </div>
            
            <div className="flex gap-8">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Index;