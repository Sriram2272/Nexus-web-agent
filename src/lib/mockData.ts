import { SearchResult, SearchTrace, SearchHistory, DemoStep } from "@/types";

export const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "Samsung 32\" Smart LED TV - Crystal UHD 4K",
    price: 24999,
    originalPrice: 32999,
    currency: "₹",
    rating: 4.3,
    reviewCount: 2847,
    seller: "Samsung Official Store",
    sellerRating: 4.8,
    shipping: "Free delivery by tomorrow",
    availability: "In Stock",
    warranty: "2 years comprehensive warranty",
    imageUrl: "/api/placeholder/300/300",
    productUrl: "#",
    source: "Flipkart",
    aiScore: 9.2,
    aiReason: "Excellent price-to-feature ratio with official warranty, fast shipping, and high seller credibility.",
    trace: [
      {
        id: "t1",
        step: 1,
        action: "Navigate to Flipkart",
        description: "Visited Flipkart homepage and initiated search",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<input type="text" class="search-input" placeholder="Search for products">',
        timestamp: "2024-01-15T10:30:15Z",
        success: true,
        details: "Successfully loaded Flipkart homepage in 1.2s"
      },
      {
        id: "t2",
        step: 2,
        action: "Search Query",
        description: "Entered search term '32 inch TV' and clicked search",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<button class="search-btn">Search</button>',
        timestamp: "2024-01-15T10:30:18Z",
        success: true,
        details: "Search returned 1,247 results"
      },
      {
        id: "t3",
        step: 3,
        action: "Filter Results",
        description: "Applied filters for Samsung brand and 4K resolution",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<div class="filter-section">Brand: Samsung</div>',
        timestamp: "2024-01-15T10:30:22Z",
        success: true,
        details: "Filtered down to 87 matching products"
      },
      {
        id: "t4",
        step: 4,
        action: "Extract Product",
        description: "Located and extracted product information using AI-powered selectors",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<div class="product-card" data-product-id="samsung-32-uhd">',
        timestamp: "2024-01-15T10:30:25Z",
        success: true,
        details: "Successfully extracted price, rating, and availability data"
      }
    ]
  },
  {
    id: "2",
    title: "LG 32\" HD Ready LED TV - 32LM563BPTC",
    price: 13999,
    originalPrice: 18999,
    currency: "₹",
    rating: 4.1,
    reviewCount: 1523,
    seller: "LG Electronics",
    sellerRating: 4.7,
    shipping: "Free delivery in 3-5 days",
    availability: "In Stock",
    warranty: "1 year manufacturer warranty",
    imageUrl: "/api/placeholder/300/300",
    productUrl: "#",
    source: "Amazon",
    aiScore: 8.7,
    aiReason: "Great budget option with reliable brand, good reviews, and significant discount.",
    trace: [
      {
        id: "t5",
        step: 1,
        action: "Navigate to Amazon",
        description: "Accessed Amazon India and performed search",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<div id="nav-search">',
        timestamp: "2024-01-15T10:30:30Z",
        success: true,
        details: "Amazon loaded successfully"
      }
    ]
  },
  {
    id: "3",
    title: "Sony Bravia 32\" Full HD Smart LED TV",
    price: 28999,
    originalPrice: 35999,
    currency: "₹",
    rating: 4.5,
    reviewCount: 892,
    seller: "Sony Centre",
    sellerRating: 4.9,
    shipping: "Free installation included",
    availability: "Limited Stock",
    warranty: "2 years + 1 year extended",
    imageUrl: "/api/placeholder/300/300",
    productUrl: "#",
    source: "Croma",
    aiScore: 8.9,
    aiReason: "Premium build quality with excellent display technology and comprehensive warranty coverage.",
    trace: [
      {
        id: "t6",
        step: 1,
        action: "Navigate to Croma",
        description: "Visited Croma website and searched for TVs",
        screenshot: "/api/placeholder/400/300",
        domSnippet: '<header class="site-header">',
        timestamp: "2024-01-15T10:30:35Z",
        success: true,
        details: "Successfully navigated to electronics section"
      }
    ]
  }
];

export const mockSearchHistory: SearchHistory[] = [
  {
    id: "h1",
    query: "32 inch smart TV under 30000",
    timestamp: "2024-01-15T10:30:00Z",
    resultCount: 3,
    executionTime: 45.2,
    sources: ["Flipkart", "Amazon", "Croma"],
    replayScript: "// Generated Playwright script\nconst { chromium } = require('playwright');\n..."
  },
  {
    id: "h2",
    query: "gaming laptop RTX 4060",
    timestamp: "2024-01-14T15:20:00Z",
    resultCount: 5,
    executionTime: 52.8,
    sources: ["Amazon", "Flipkart", "Vijay Sales"],
  },
  {
    id: "h3",
    query: "wireless earbuds noise cancelling",
    timestamp: "2024-01-13T09:15:00Z",
    resultCount: 8,
    executionTime: 38.9,
    sources: ["Amazon", "Flipkart", "Croma", "Reliance Digital"],
  }
];

export const mockDemoSteps: DemoStep[] = [
  {
    id: "d1",
    title: "Multi-Site Search Initialization",
    description: "AI simultaneously launches browsers for Flipkart, Amazon, and Croma to search for '32 inch TV'",
    screenshot: "/api/placeholder/800/450",
    highlight: { x: 100, y: 150, width: 600, height: 200 },
    duration: 3000
  },
  {
    id: "d2", 
    title: "Intelligent Product Detection",
    description: "Advanced selectors identify product cards across different site layouts using text patterns and visual cues",
    screenshot: "/api/placeholder/800/450",
    highlight: { x: 200, y: 200, width: 400, height: 300 },
    duration: 4000
  },
  {
    id: "d3",
    title: "Smart Price Extraction",
    description: "AI extracts pricing information, handles different currencies, and identifies discounts automatically",
    screenshot: "/api/placeholder/800/450",
    highlight: { x: 300, y: 100, width: 200, height: 100 },
    duration: 3500
  },
  {
    id: "d4",
    title: "AI-Powered Ranking",
    description: "Results are scored using price, ratings, seller credibility, shipping speed, and warranty terms",
    screenshot: "/api/placeholder/800/450",
    highlight: { x: 50, y: 300, width: 700, height: 200 },
    duration: 4500
  },
  {
    id: "d5",
    title: "Explainable Trace Generation",
    description: "Each result includes a complete step-by-step trace showing exactly how the data was extracted",
    screenshot: "/api/placeholder/800/450",
    highlight: { x: 400, y: 50, width: 350, height: 400 },
    duration: 5000
  }
];