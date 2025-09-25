import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Bot, History, Search, FileText, LogIn, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { path: "/", label: "Search", icon: Search },
    { path: "/history", label: "History", icon: History },
    { path: "/docs", label: "Docs", icon: FileText },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center neural-glow">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-gradient-neural">WebNavigatorAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-neural"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span>Local AI</span>
            </div>

            {/* Auth Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">
                      {user.email?.split('@')[0] || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/20 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="flex items-center gap-2 px-4 py-2 text-accent text-sm">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                <span>100% Local Processing</span>
              </div>

              {/* Mobile Auth */}
              <div className="px-4 pt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {user.email}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button asChild variant="default" size="sm" className="w-full">
                    <Link 
                      to="/auth" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};