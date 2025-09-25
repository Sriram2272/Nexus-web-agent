import { useState } from "react";
import { SearchResult } from "@/types";
import { Download, FileJson, FileSpreadsheet, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  results: SearchResult[];
  query: string;
}

export const ExportPanel = ({ results, query }: ExportPanelProps) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case 'json':
          content = JSON.stringify({
            query,
            timestamp: new Date().toISOString(),
            results: results.map(r => ({
              ...r,
              trace: r.trace.map(t => ({ ...t, screenshot: 'data:image/png;base64,...' }))
            }))
          }, null, 2);
          filename = `webnavigator-${query.replace(/\s+/g, '-')}-${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          const csvHeaders = 'Title,Price,Currency,Rating,Reviews,Seller,Source,AI Score,AI Reason,URL\n';
          const csvRows = results.map(r => 
            `"${r.title}","${r.price}","${r.currency}","${r.rating}","${r.reviewCount}","${r.seller}","${r.source}","${r.aiScore}","${r.aiReason}","${r.productUrl}"`
          ).join('\n');
          content = csvHeaders + csvRows;
          filename = `webnavigator-${query.replace(/\s+/g, '-')}-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;

        case 'replay':
          content = generatePlaywrightScript(query, results);
          filename = `webnavigator-replay-${query.replace(/\s+/g, '-')}-${Date.now()}.js`;
          mimeType = 'text/javascript';
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const generatePlaywrightScript = (query: string, results: SearchResult[]) => {
    return `// WebNavigatorAI - Replay Script
// Generated: ${new Date().toISOString()}
// Query: "${query}"

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('🤖 Starting WebNavigatorAI replay for: "${query}"');

  // Search on Flipkart
  const flipkartPage = await context.newPage();
  await flipkartPage.goto('https://www.flipkart.com');
  await flipkartPage.fill('[name="q"]', '${query}');
  await flipkartPage.click('button[type="submit"]');
  await flipkartPage.waitForLoadState('networkidle');
  await flipkartPage.screenshot({ path: 'flipkart-results.png' });
  console.log('✅ Flipkart search completed');

  // Search on Amazon
  const amazonPage = await context.newPage();
  await amazonPage.goto('https://www.amazon.in');
  await amazonPage.fill('#twotabsearchtextbox', '${query}');
  await amazonPage.click('#nav-search-submit-button');
  await amazonPage.waitForLoadState('networkidle');
  await amazonPage.screenshot({ path: 'amazon-results.png' });
  console.log('✅ Amazon search completed');

  // Search on Croma
  const cromaPage = await context.newPage();
  await cromaPage.goto('https://www.croma.com');
  await cromaPage.fill('[data-testid="search-input"]', '${query}');
  await cromaPage.press('[data-testid="search-input"]', 'Enter');
  await cromaPage.waitForLoadState('networkidle');
  await cromaPage.screenshot({ path: 'croma-results.png' });
  console.log('✅ Croma search completed');

  console.log('🎯 Found ${results.length} results across all sites');
  ${results.map((r, i) => `console.log('${i + 1}. ${r.title} - ${r.currency}${r.price} (Score: ${r.aiScore})');`).join('\n  ')}

  await browser.close();
  console.log('🚀 Replay completed successfully!');
})();`;
  };

  const stats = {
    totalResults: results.length,
    avgPrice: results.reduce((sum, r) => sum + r.price, 0) / results.length,
    topScore: Math.max(...results.map(r => r.aiScore)),
    sites: [...new Set(results.map(r => r.source))].length
  };

  return (
    <Card className="p-6 sticky top-24">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Results
          </h3>
          <p className="text-sm text-muted-foreground">
            Download your search results in various formats
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-lg font-bold text-primary">{stats.totalResults}</div>
            <div className="text-xs text-muted-foreground">Results</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/5">
            <div className="text-lg font-bold text-secondary">{stats.sites}</div>
            <div className="text-xs text-muted-foreground">Sites</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/5">
            <div className="text-lg font-bold text-accent">₹{Math.round(stats.avgPrice).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Avg Price</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/5">
            <div className="text-lg font-bold text-warning">{stats.topScore}</div>
            <div className="text-xs text-muted-foreground">Top Score</div>
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Export Formats</h4>
          
          <Button
            onClick={() => handleExport('json')}
            disabled={isExporting !== null}
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-primary/5 hover:border-primary/20"
          >
            {isExporting === 'json' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 text-primary" />
            )}
            <div className="text-left">
              <div className="font-medium">JSON Export</div>
              <div className="text-xs text-muted-foreground">Complete data with traces</div>
            </div>
            <Badge variant="secondary" className="ml-auto">Rich</Badge>
          </Button>

          <Button
            onClick={() => handleExport('csv')}
            disabled={isExporting !== null}
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-accent/5 hover:border-accent/20"
          >
            {isExporting === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-accent" />
            )}
            <div className="text-left">
              <div className="font-medium">CSV Export</div>
              <div className="text-xs text-muted-foreground">For spreadsheet analysis</div>
            </div>
            <Badge variant="secondary" className="ml-auto">Simple</Badge>
          </Button>

          <Button
            onClick={() => handleExport('replay')}
            disabled={isExporting !== null}
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-secondary/5 hover:border-secondary/20"
          >
            {isExporting === 'replay' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-secondary" />
            )}
            <div className="text-left">
              <div className="font-medium">Replay Script</div>
              <div className="text-xs text-muted-foreground">Playwright automation</div>
            </div>
            <Badge variant="secondary" className="ml-auto">Script</Badge>
          </Button>
        </div>

        <Separator />

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span>All exports include AI scoring data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>JSON format includes full trace data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>Replay scripts work with Playwright</span>
          </div>
        </div>
      </div>
    </Card>
  );
};