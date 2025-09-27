import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";
import { checkOllamaStatus } from "@/lib/ollamaApi";

export const LocalModelBadge = () => {
  const [isLocal, setIsLocal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkOllamaStatus();
        setIsLocal(status.isLocal && status.localModels > 0);
      } catch (error) {
        setIsLocal(false);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <Badge 
      variant={isLocal ? "default" : "destructive"}
      className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 ${
        isLocal 
          ? "bg-green-600 hover:bg-green-700 text-white" 
          : "bg-red-600 hover:bg-red-700 text-white"
      }`}
    >
      <Circle className="w-2 h-2 fill-current" />
      <span className="text-xs font-medium">
        Local Model: {isLocal ? "ON" : "OFF"}
      </span>
    </Badge>
  );
};